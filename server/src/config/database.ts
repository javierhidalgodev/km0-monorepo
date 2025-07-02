import mongoose from 'mongoose';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev'

export const connnectToDatabase = async () => {
    try {
        await mongoose.connect(MONGO_DB_URI, {
            timeoutMS: 5000,
        });
        console.log('✅ Conectado a la base de datos');
    } catch (error) {
        console.log('❌ Error al conectar con la base de datos: ' + error);
        process.exit(1);
    }
}