import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { abstract, paperId } = await req.json();
    if (!abstract || !paperId) {
      return new Response(JSON.stringify({ error: "Missing abstract or paperId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a scientific paper analyzer. Given an abstract, extract exactly these fields as a JSON object. Be specific, include numbers when available. If a field cannot be determined, use "N/A".

Fields:
- model: The study model (e.g., "Human", "Mouse", "In vitro", "Meta-analysis", "Computational", or other)
- sampleSize: Sample size (e.g., "n=120 patients", "n=45 mice", "12 studies pooled")
- method: Research method (e.g., "RCT", "Observational cohort", "16S rRNA sequencing", "GWAS", "Systematic review")
- keyFinding: One sentence summarizing the key finding, as specific as possible with numbers
- mainLimitation: One sentence about the main limitation
- stage: Research stage - one of: "Basic", "Pre-clinical", "Clinical", "Review"

Return ONLY a valid JSON object with these 6 keys, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this abstract:\n\n${abstract}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in text
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    const snapshot = {
      model: parsed.model || "N/A",
      sampleSize: parsed.sampleSize || "N/A",
      method: parsed.method || "N/A",
      keyFinding: parsed.keyFinding || "N/A",
      mainLimitation: parsed.mainLimitation || "N/A",
      stage: parsed.stage || "N/A",
    };

    return new Response(JSON.stringify({ paperId, snapshot }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-abstract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
