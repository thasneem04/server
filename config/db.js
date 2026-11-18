import mongoose from "mongoose";

const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URI || process.env.Mongo_URI);
        console.log("MongoDB connected Successfully");
    }
    catch(err)
    {
        console.log("DB Connection Failed",err.message);
        process.exit(1);
    }
}

export default connectDB;