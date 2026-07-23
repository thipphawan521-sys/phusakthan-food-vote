# PHUSAKTHAN FOOD VOTE V5 — วิธีติดตั้งแบบอัปโหลดทับ

ชุดนี้รวมครบแล้ว:
- หน้าโหวต
- หน้า Admin แบบ Login
- เปิด/ปิดรับโหวต
- ล้างผลโหวต
- Export CSV
- พิมพ์/PDF
- QR Code
- เปลี่ยนธีมสีจากหน้า Admin แบบ Real-time

## วิธีอัปโหลดจาก iPhone

1. แตกไฟล์ ZIP ในแอป Files
2. เปิด GitHub repository `phusakthan-food-vote`
3. กด `Add file` → `Upload files`
4. เลือกไฟล์ทั้งหมดจากโฟลเดอร์ที่แตก ZIP
5. GitHub จะแจ้งว่าไฟล์ชื่อเดิมจะถูกแทนที่
6. ใส่ Commit message: `Upgrade to V5 complete`
7. กด Commit changes

## Firebase Authentication

Firebase Console → Authentication → Sign-in method
- เปิด Anonymous สำหรับผู้โหวต
- เปิด Email/Password สำหรับ Admin
- สร้างบัญชี Admin

## Firestore Rules

1. เปิดไฟล์ `firestore.rules`
2. เปลี่ยน `REPLACE_WITH_ADMIN_UID` เป็น UID ของบัญชี Admin
3. Firebase Console → Firestore Database → Rules
4. วาง Rules และกด Publish

## เข้าใช้งาน

หน้าโหวต:
https://phusakthan-food-vote.netlify.app/

หน้า Admin:
https://phusakthan-food-vote.netlify.app/admin.html

หลังอัปโหลด Netlify จะ Deploy อัตโนมัติ โดยปกติใช้เวลาไม่นาน
