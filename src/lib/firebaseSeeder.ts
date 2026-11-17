import { 
  collection, 
  writeBatch, 
  doc, 
  getDocs,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  mockCategories, 
  mockProducts, 
  mockDeliveryZones, 
  mockCoupons, 
  mockCmsSections, 
  mockGiftBuilderConfig 
} from './mockData';

export async function seedDatabase() {
  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  // 1. Categories
  mockCategories.forEach(cat => {
    const ref = doc(db, 'categories', cat.id);
    operations.push((batch) => batch.set(ref, cat));
  });

  // 2. Products
  mockProducts.forEach(prod => {
    const ref = doc(db, 'products', prod.id!);
    operations.push((batch) =>
      batch.set(ref, {
        ...prod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
  });

  // 3. Delivery Zones
  mockDeliveryZones.forEach(dz => {
    const ref = doc(db, 'deliveryZones', dz.id);
    operations.push((batch) => batch.set(ref, dz));
  });

  // 4. Coupons
  mockCoupons.forEach(cp => {
    const ref = doc(db, 'coupons', cp.id);
    operations.push((batch) => batch.set(ref, cp));
  });

  // 5. CMS Sections
  mockCmsSections.forEach(cms => {
    const ref = doc(db, 'cmsSections', cms.id);
    operations.push((batch) => batch.set(ref, cms));
  });

  // 6. Config
  const giftConfigRef = doc(db, 'config', 'giftBuilder');
  operations.push((batch) => batch.set(giftConfigRef, mockGiftBuilderConfig));

  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    operations.slice(i, i + CHUNK_SIZE).forEach(op => op(batch));
    await batch.commit();
  }

  console.log(`Database seeded successfully with ${mockProducts.length} products across ${mockCategories.length} categories`);
}

export async function isDatabaseEmpty() {
  const q = await getDocs(collection(db, 'products'));
  return q.empty;
}
