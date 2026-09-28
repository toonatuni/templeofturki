const mongoose =
    require("mongoose");


const donationSchema =
    new mongoose.Schema({

        userId: {

            type: String,

            required: true,

            index: true

        },


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


module.exports =
    mongoose.model(
        "Donation",
        donationSchema
    );