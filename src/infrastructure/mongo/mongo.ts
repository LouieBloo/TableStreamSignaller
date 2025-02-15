import mongoose from 'mongoose';


if(process.env.MONGODB_URI){
    console.log("Starting mongoose...")
    const mongoUri = process.env.MONGODB_URI;

    mongoose
      .connect(mongoUri)
      .then(() => console.log('Connected to MongoDB Atlas'))
      .catch((err) => console.error('MongoDB connection error:', err));
}else{
    console.log("Skipping mongo")
}

