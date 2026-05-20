import mongoose, { ObjectId } from "mongoose";
import { connnectToDatabase } from "@/config/database";
import { UserModel } from "@/models/user.model";
import { hashPassword } from "@/utils/auth.utils";

const seed = async () => {
    await connnectToDatabase();

    // TODO: borrar usuarios
    await UserModel.deleteMany({});

    // TODO: crear usuario
    const seedUsers = [
        { username: 'azahara', email: 'azahara@km0.dev', birthdate: '1990-01-01', bio: 'Runner', isPublic: true },
        { username: 'bruno', email: 'bruno@km0.dev', birthdate: '1991-01-01', bio: 'Walker', isPublic: false },
        { username: 'omar', email: 'omar@km0.dev', birthdate: '1992-01-01', bio: 'Runner', isPublic: false },
        { username: 'valeria', email: 'valeria@km0.dev', birthdate: '1993-01-01' },
        { username: 'olga', email: 'olga@km0.dev', birthdate: '1994-01-01', bio: 'Swimmer', isPublic: true },
        { username: 'gema', email: 'gema@km0.dev', birthdate: '1995-01-01', bio: 'Runner', isPublic: true },
        { username: 'jose', email: 'jose@km0.dev', birthdate: '1996-01-01', bio: 'Runner', isPublic: false },
        { username: 'diana', email: 'diana@km0.dev', birthdate: '1997-01-01', isPublic: true },
        { username: 'luna', email: 'luna@km0.dev', birthdate: '1998-01-01', bio: 'Runner' },
        { username: 'gabi', email: 'gabi@km0.dev', birthdate: '1999-01-01', bio: 'Runner', isPublic: true },
    ];

    const passwordHash = await hashPassword('Password123!');

    const users = await UserModel.insertMany(
        seedUsers.map(u => ({
            ...u,
            password: passwordHash
        }))
    );
    // TODO: crear follows

    const userIds = users.map<ObjectId>(u => u._id as ObjectId);

    const followingMap = new Map<string, Set<typeof userIds[0]>>();
    const followersMap = new Map<string, Set<typeof userIds[0]>>();

    const addFollow = (
        followerId: typeof userIds[0],
        followedId: typeof userIds[0],
    ) => {
        const followerKey = followerId.toString();
        const followedKey = followedId.toString();

        if(!followingMap.has(followerKey)) followingMap.set(followerKey, new Set());
        if(!followersMap.has(followedKey)) followersMap.set(followedKey, new Set());

        followingMap.get(followerKey)!.add(followedId);
        followersMap.get(followedKey)!.add(followerId);
    }

    for (let i = 0; i < userIds.length; i += 1) {
        addFollow(userIds[i], userIds[(i + 1) % userIds.length]);
        addFollow(userIds[i], userIds[(i + 2) % userIds.length]);
        addFollow(userIds[i], userIds[(i + 3) % userIds.length]);
    }

    const bulkOps = userIds.map((id) => ({
        updateOne: {
            filter: { _id: id },
            update: {
                $set: {
                    following: Array.from(followingMap.get(id.toString()) ?? []),
                    followers: Array.from(followersMap.get(id.toString()) ?? []),
                    followRequests: [],
                }
            }
        }
    }));

    await UserModel.bulkWrite(bulkOps);
    await mongoose.connection.close();
}

seed().catch((error) => {
    console.log('Seed failed: ', error);
    process.exitCode = 1;
});