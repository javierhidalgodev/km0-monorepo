import app from '@/app';
import { connnectToDatabase } from '@/config/database';

const PORT = process.env.PORT || 3000;

connnectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`KM.0 API is running on http://localhost:${PORT}`);
    });
})
