import mongoose from 'mongoose';

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    console.log('MongoDB 已连接');
    return;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flight_system';
  
  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('✅ MongoDB 连接成功');
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err.message);
    console.log('提示: 请确保MongoDB已启动，或在.env中配置MONGODB_URI');
    throw err;
  }
}

export function getTripModel() {
  if (!mongoose.models.Trip) {
    const tripSchema = new mongoose.Schema({
      username: {
        type: String,
        required: true,
        index: true
      },
      flightNo: {
        type: String,
        required: true
      },
      airline: {
        type: String,
        required: true
      },
      depAirport: {
        type: String,
        required: true
      },
      depAirportCode: {
        type: String,
        required: true
      },
      arrAirport: {
        type: String,
        required: true
      },
      arrAirportCode: {
        type: String,
        required: true
      },
      depTime: {
        type: String,
        required: true
      },
      arrTime: {
        type: String,
        required: true
      },
      flightDate: {
        type: String,
        required: true
      },
      notes: {
        type: String,
        default: ''
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    });

    mongoose.model('Trip', tripSchema);
  }

  return mongoose.model('Trip');
}
