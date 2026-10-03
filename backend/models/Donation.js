const mongoose =
    require("mongoose");


const donationSchema =
    new mongoose.Schema({

        userId: {

            type: String,

            default: null,

            index: true

        },

        submissionKey: {

            type: String,

            trim: true

        },

        guestAccessTokenHash: {

            type: String,

            select: false

        },

        utr: {

            type: String,

            trim: true,

            uppercase: true,
            maxlength: 32,
            match: /^[A-Z0-9]{6,32}$/

        },

        utrSubmittedAt: Date,

        verifiedBy: String,

        verifiedAt: Date,


        name: {

            type: String,

            required: true

        },


        mobile: {

            type: String,

            required: true

        },


        amount: {

            type: Number,

            required: true

        },


        purpose: {

            type: String,

            default: "TOT Donation"

        },


        status: {

            type: String,

            enum: [
                "pending",
                "paid",
                "failed"
            ],

            default: "pending",

            index: true

        },


        paidAt:
            Date,


        createdAt: {

            type: Date,

            default: Date.now

        }

    });

donationSchema.index(
    { submissionKey: 1 },
    {
        unique: true,
        partialFilterExpression: { submissionKey: { $type: "string" } }
    }
);

donationSchema.index(
    { utr: 1 },
    {
        unique: true,
        partialFilterExpression: { utr: { $type: "string" } }
    }
);


module.exports =
    mongoose.model(
        "Donation",
        donationSchema
    );