import { 
  collection, 
  writeBatch, 
  doc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { stripUndefined } from './firestoreErrors';
import { 
  mockCategories, 
  mockProducts, 
  mockDeliveryZones, 
  mockSuppliers,
  mockInventoryRecords,
  mockDrivers,
  mockPromotions,
  mockCoupons, 
  mockCampaigns,
  mockCmsSections, 
  mockGiftBuilderConfig 
} from './mockData';

export async function seedDatabase() {
  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  // 1. Categories
  mockCategories.forEach(cat => {
    const ref = doc(db, 'categories', cat.id);
    operations.push((batch) => batch.set(ref, stripUndefined(cat)));
  });

  // 2. Products & baseline InventoryRecords
  mockProducts.forEach(prod => {
    const id = prod.id!;
    const ref = doc(db, 'products', id);
    operations.push((batch) =>
      batch.set(
        ref,
        stripUndefined({
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      )
    );

    const existingMockInv = mockInventoryRecords.find(r => r.productId === id);
    const invRef = doc(db, 'inventoryRecords', id);
    operations.push((batch) =>
      batch.set(invRef, {
        productId: id,
        stock: existingMockInv?.stock ?? Number(prod.inventory ?? 25),
        reserved: existingMockInv?.reserved ?? 0,
        damaged: existingMockInv?.damaged ?? 0,
        sold: existingMockInv?.sold ?? 0,
        incoming: existingMockInv?.incoming ?? 0,
        lowStockThreshold: existingMockInv?.lowStockThreshold ?? 8,
        updatedAt: serverTimestamp(),
      })
    );
  });

  // 3. Delivery Zones
  mockDeliveryZones.forEach(dz => {
    const ref = doc(db, 'deliveryZones', dz.id);
    operations.push((batch) => batch.set(ref, stripUndefined(dz)));
  });

  // 4. Drivers
  mockDrivers.forEach(drv => {
    const ref = doc(db, 'drivers', drv.id);
    operations.push((batch) => batch.set(ref, stripUndefined(drv)));
  });

  // 5. Suppliers
  mockSuppliers.forEach(sup => {
    const ref = doc(db, 'suppliers', sup.id);
    operations.push((batch) => batch.set(ref, stripUndefined(sup)));
  });

  // 6. Promotions
  mockPromotions.forEach(promo => {
    const ref = doc(db, 'promotions', promo.id);
    operations.push((batch) => batch.set(ref, stripUndefined(promo)));
  });

  // 7. Coupons
  mockCoupons.forEach(cp => {
    const ref = doc(db, 'coupons', cp.id);
    operations.push((batch) => batch.set(ref, stripUndefined(cp)));
  });

  // 8. Campaigns
  mockCampaigns.forEach(camp => {
    const ref = doc(db, 'campaigns', camp.id);
    operations.push((batch) => batch.set(ref, stripUndefined(camp)));
  });

  // 9. CMS Sections
  mockCmsSections.forEach(cms => {
    const ref = doc(db, 'cmsSections', cms.id);
    operations.push((batch) => batch.set(ref, stripUndefined(cms)));
  });

  // 10. Config
  const giftConfigRef = doc(db, 'config', 'giftBuilder');
  operations.push((batch) => batch.set(giftConfigRef, stripUndefined(mockGiftBuilderConfig)));

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
