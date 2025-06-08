import "../src/infrastructure/mongo/mongo";
import MongoUser from '../src/infrastructure/mongo/models/user-model';
import User, { IMongoUser } from '../src/infrastructure/mongo/models/user-model';
import bcrypt from 'bcrypt';

async function waitFiveSeconds() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
}

const run = async()=>{
    await waitFiveSeconds();

    const user = await User.findOne({ email: "leggioluke5@gmail.com" });

    if(user){
        const passwordHash = await bcrypt.hash("1234567890", 12);
        user.passwordHash = passwordHash;
        user.verifiedEmail = true;

        await user.save();
        console.log("done")
    }
}

run();