import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Content from '../models/Content.js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

const removeDuplicates = async () => {
  console.log('Starting duplicate removal process...');

  try {
    const aggregationPipeline = [
      // Stage 1: Group documents by normalized text and type to find duplicates
      {
        $group: {
          _id: {
            // Normalize text to be case-insensitive for grouping
            text: { $toLower: '$text' },
            type: '$type',
          },
          // Collect the _id and createdAt of all documents in the group
          docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      // Stage 2: Filter for groups that have more than one document (i.e., are duplicates)
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ];

    const duplicateGroups = await Content.aggregate(aggregationPipeline);

    if (duplicateGroups.length === 0) {
      console.log('No duplicate content found.');
      return;
    }

    console.log(`Found ${duplicateGroups.length} groups of duplicate content.`);
    let totalDeleted = 0;

    for (const group of duplicateGroups) {
      // Sort documents within the group by creation date, oldest first
      group.docs.sort((a, b) => a.createdAt - b.createdAt);

      // The first document is the one we keep, the rest are duplicates to be deleted
      const docsToDelete = group.docs.slice(1);
      const idsToDelete = docsToDelete.map(doc => doc._id);

      if (idsToDelete.length > 0) {
        console.log(`- Deleting ${idsToDelete.length} duplicates for content: "${group._id.text.substring(0, 40)}..."`);
        const deleteResult = await Content.deleteMany({
          _id: { $in: idsToDelete },
        });
        totalDeleted += deleteResult.deletedCount;
      }
    }

    console.log(`\n✅ Successfully deleted ${totalDeleted} duplicate documents.`);

  } catch (error) {
    console.error('An error occurred during duplicate removal:', error);
  }
};

const run = async () => {
  await connectDB();
  await removeDuplicates();
  await mongoose.connection.close();
  console.log('Process finished. MongoDB connection closed.');
};

run();
