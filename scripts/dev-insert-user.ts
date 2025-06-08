import "../src/mongo/mongo";
import MongoUser from '../src/infrastructure/mongo/models/user-model';
const { v4: uuidv4 } = require('uuid');

async function waitFiveSeconds() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
}

const run = async()=>{
    await waitFiveSeconds();

    const user = new MongoUser({
        name: "",
        email: "",
        developerToken: uuidv4()
    });

    return await user.save(); 
}

run();