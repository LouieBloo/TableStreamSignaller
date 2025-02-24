import mongoose from 'mongoose';

if(process.env.mongoUrI){
    console.log("Starting mongoose...")
    const mongoUri = process.env.mongoUrI;
    mongoose
      .connect(mongoUri)
      .then(() => console.log('Connected to MongoDB Atlas'))
      .catch((err) => console.error('MongoDB connection error:', err));
}else{
    console.log("Skipping mongo")
}

