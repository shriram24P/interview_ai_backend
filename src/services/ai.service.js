const Groq = require("groq-sdk");
const puppeteer = require("puppeteer");

const groq = new Groq({
  apiKey: process.env.GROQ_API,
});

const interviewReportSchema = {
  type: "json_schema",
  json_schema: {
    name: "interview_report",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        matchScore: {
          type: "number",
          description:
            "A score between 0 and 100 indicating how well the candidate matches the job",
        },

        technicalQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              intention: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "intention", "answer"],
            additionalProperties: false,
          },
        },

        behavioralQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              intention: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "intention", "answer"],
            additionalProperties: false,
          },
        },

        skillGaps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              severity: {
                type: "string",
                enum: ["low", "medium", "high"],
              },
            },
            required: ["skill", "severity"],
            additionalProperties: false,
          },
        },

        preparationPlan: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              focus: { type: "string" },
              tasks: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["day", "focus", "tasks"],
            additionalProperties: false,
          },
        },
      },

      required: [
        "matchScore",
        "technicalQuestions",
        "behavioralQuestions",
        "skillGaps",
        "preparationPlan",
        "title",
      ],

      additionalProperties: false,
    },
  },
};

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
Generate an interview report using the following candidate information.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `
You generate structured interview reports.

The output MUST be valid JSON matching the schema exactly.

The JSON must include these fields:
- matchScore
- technicalQuestions
- behavioralQuestions
- skillGaps
- preparationPlan
- title

Each section must contain meaningful data.

Do not omit any fields.
Return ONLY JSON.
`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: interviewReportSchema,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return result;
}

const resumePdfSchema = {
  type: "json_schema",
  json_schema: {
    name: "resume_pdf",
    schema: {
      type: "object",
      properties: {
        html: {
          type: "string",
        },
      },
      required: ["html"],
    },
  },
};
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const prompt = `
You are a senior technical recruiter and professional resume writer.

Your task is to CREATE an improved resume in HTML format using the information below.

Candidate Resume Text:
${resume}

Candidate Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

IMPORTANT INSTRUCTIONS:

- DO NOT copy the resume text verbatim.
- Rewrite and improve the resume to sound professional and impactful.
- Convert responsibilities into achievement-focused bullet points.
- Use strong action verbs such as:
  Developed, Built, Implemented, Optimized, Led, Designed, Improved.
- Remove weak statements such as "seeking opportunity".
- Tailor the resume for the given job description.
- Highlight relevant technical skills.
- If projects exist, rewrite them to emphasize technical impact.
- Keep the resume concise so it fits within 1–2 pages when converted to PDF.
- Ensure the resume is ATS friendly.

Design Requirements:
- Clean professional layout
- Use simple CSS
- Highlight section headings with subtle colors
- Avoid complex layouts

Return ONLY a complete HTML document.
Do not wrap the output in markdown.
`;

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You generate professional ATS-friendly resume HTML suitable for PDF conversion.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  let html = response.choices[0].message.content;

  console.log("AI RAW OUTPUT:", html);

  // Remove markdown wrappers
  html = html
    .replace(/^```html\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  console.log("CLEAN HTML:", html);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return pdfBuffer;
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
};
