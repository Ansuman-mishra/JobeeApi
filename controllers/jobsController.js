const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const job = require("../models/jobs");
const APIFilters = require("../utils/apiFilters");
const ErrorHandler = require("../utils/errorHandler");
const geoCoder = require("../utils/geocoder");
const path = require("path");
// Get all Jobs => /api/v1/jobs
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
    const apiFilters = new APIFilters(job.find(), req.query).filter().sort().limitFields().searchByQuery().pagination();
    const jobs = await apiFilters.query;
    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs,
    });
});
// Get single Jobs by slug => /api/v1/jobs/:id/:slug
exports.getJob = catchAsyncErrors(async (req, res, next) => {
    const { id, slug } = req.params;

    let Job = await job.find({ $and: [{ _id: id }, { slug: slug }] });
    if (!Job || Job.length === 0) {
        // return res.status(404).json({
        //     success: false,
        //     message: "Job Not Found",
        // });
        return next(new ErrorHandler("Job not found", 404));
    }
    res.status(200).json({
        success: true,
        data: Job,
    });
});

// Create a new Jobs => /api/v1/job/new

exports.newJob = catchAsyncErrors(async (req, res, next) => {
    req.body.user = req.user.id;
    const newJob = await job.create(req.body);

    res.status(200).json({
        success: true,
        message: "Job Created Successfully",
        data: newJob,
    });
});

// Update a Job => /api/v1/job/:id

exports.updateJob = catchAsyncErrors(async (req, res, next) => {
    let Job = await job.findById(req.params.id);
    if (!Job) {
        // return res.status(404).json({
        //     success: false,
        //     message: "Job Not Found",
        // });
        return next(new ErrorHandler("Job not found", 404));
    }
    Job = await job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        message: "Job Updated Successfully",
        data: Job,
    });
});

exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
    let Job = job.findById(req.params.id);

    if (!Job) {
        // return res.status(404).json({
        //     success: false,
        //     message: "Job Not Found",
        // });
        return next(new ErrorHandler("Job not found", 404));
    }
    Job = await job.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: "Job Deleted Successfully",
    });
});

// Search jobs with radius => /api/v1/jobs/:zipcode/:distance

exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // Getting lat and long from geocoder with zipcode
    const loc = await geoCoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const long = loc[0].longitude;

    const radius = distance / 3963;
    const jobs = await job.find({
        location: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
    });
    res.status(200).json({
        success: true,
        results: jobs.length,
        data: jobs,
    });
});

// Get stats about a topic(job) => /api/v1/stats/:topic
// "\"" + req.params.topic + "\""
exports.jobStats = catchAsyncErrors(async (req, res, next) => {
    const stats = await job.aggregate([
        {
            $match: { $text: { $search: '"' + req.params.topic + '"' } },
        },
        {
            $group: {
                _id: { $toUpper: "$experience" },
                totalJobs: { $sum: 1 },
                avgPosition: { $avg: "$positions" },
                avgSalary: { $avg: "$salary" },
                minSalary: { $min: "$salary" },
                maxSalary: { $max: "$salary" },
            },
        },
    ]);
    if (stats.length === 0) {
        // return res.status(404).json({
        //     success: false,
        //     message: `No stats found for - ${req.params.topic}`,
        // });
        return next(new ErrorHandler(`No stats found for - ${req.params.topic}`, 404));
    }
    res.status(200).json({
        success: true,
        data: stats,
    });
});
// .select("+applicantApplied")
// Apply to job using Resume  =>  /api/v1/job/:id/apply
exports.applyJob = catchAsyncErrors(async (req, res, next) => {
    let Job = await job.findById(req.params.id).select("+applicantApplied");
    if (!job) {
        return next(new ErrorHandler("Job not found.", 404));
    }

    // Check that if job last date has been passed or not
    if (Job.lastDate < new Date(Date.now())) {
        return next(new ErrorHandler("You can not apply to this job. Date is over.", 400));
    }

    // Check if user has applied before
    for (let i = 0; i < Job.applicantApplied.length; i++) {
        if (Job.applicantApplied[i].id === req.user.id) {
            return next(new ErrorHandler("You have already applied for this job.", 400));
        }
    }

    // Check the files
    if (!req.files) {
        return next(new ErrorHandler("Please upload file.", 400));
    }

    const file = req.files.file;

    // Check file type
    const supportedFiles = /.docx|.pdf/;
    if (!supportedFiles.test(path.extname(file.name))) {
        return next(new ErrorHandler("Please upload document file.", 400));
    }

    // Check doucument size
    if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorHandler("Please upload file less than 2MB.", 400));
    }

    // Renaming resume
    file.name = `${req.user.name.replace(" ", "_")}_${Job._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
        if (err) {
            console.log(err);
            return next(new ErrorHandler("Resume upload failed.", 500));
        }

        await job.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    applicantApplied: {
                        id: req.user.id,
                        resume: file.name,
                    },
                },
            },
            {
                new: true,
                runValidators: true,
                useFindAndModify: false,
            }
        );

        res.status(200).json({
            success: true,
            message: "Applied to Job successfully.",
            data: file.name,
        });
    });
});
