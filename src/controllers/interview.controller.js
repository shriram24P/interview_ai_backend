const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Controller to generate interview report based onuser self description, resume and job description
 */
async function generateInterviewReportController(req, res) {
  try {
    const resumeFile = req.file; // Access the uploaded resume file

    if (!resumeFile || !resumeFile.buffer) {
      return res
        .status(400)
        .json({ message: "Resume file is required (field name: resume)" });
    }

    // pdf-parse accepts a Buffer or Uint8Array and returns an object with `text`
    const resumeParseResult = await new pdfParse.PDFParse(
      Uint8Array.from(resumeFile.buffer),
    ).getText();
    const resumeText = resumeParseResult.text || "";

    const { jobDescription, selfDescription } = req.body;

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...interviewReportByAi,
    });

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
    });
  } catch (err) {
    console.error("Error generating interview report:", err);
    return res.status(500).json({
      message: "Failed to generate interview report",
      error: err.message,
    });
  }
}

async function getInterviewReportByIdController(req, res) {
  const { interviewId } = req.params;

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({
      message: "interview report not found",
    });
  }

  res.status(200).json({
    message: "Interview report fetched successfully",
    interviewReport,
  });
}

async function getAllInterviewReportsController(req, res) {
  const interviewReports = await interviewReportModel
    .find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select(
      "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
    );

  return res.status(200).json({
    message: "Interview reports fetched successfully",
    interviewReports,
  });
}

/**
 * @description Controller to generate resume pdf
 * @params resume, selfDescription, jobDescription
 * @returns resume pdf
 */

async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;
    const interviewReport =
      await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({
        message: "interview report not found",
      });
    }

    const { resume, selfDescription, jobDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      selfDescription,
      jobDescription,
    });
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.log("Error generating resume PDF: ", error);
  }
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};
