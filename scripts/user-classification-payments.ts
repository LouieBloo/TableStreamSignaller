import "../src/infrastructure/mongo/mongo";
import UserClassification from '../src/infrastructure/mongo/models/user-classification-model';

const run = async()=>{
    const results = await UserClassification.aggregate([
        {
          $match: { action: 'CLASSIFIED' } // Only classified records
        },
        {
          $group: {
            _id: '$user',        // Group by user _id
            classificationCount: { $sum: 1 } // Count how many classified per user
          }
        },
        {
          $lookup: {
            from: 'users',        // MongoDB collection name is usually lowercase plural
            localField: '_id',    // _id from the $group stage (which is user _id)
            foreignField: '_id',  // _id of User
            as: 'user'
          }
        },
        {
          $unwind: '$user' // Flatten the user array
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            userName: '$user.name',
            classificationCount: 1
          }
        },
        {
          $sort: { classificationCount: -1 } // optional: highest to lowest
        }
      ]);
      
      console.log(results);
}

run();

