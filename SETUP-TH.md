# ติดตั้งระบบ Admin แบบปลอดภัย

ไฟล์ชุดนี้เพิ่ม:
- ล็อกอิน Admin ด้วย Firebase Email/Password
- ปุ่มเปิด/ปิดการโหวต
- ปุ่มล้างผลโหวตทั้งหมด
- Export CSV
- พิมพ์/บันทึก PDF
- คัดลอกข้อความสรุป
- Dashboard แบบ Real-time

## 1) อัปโหลดไฟล์ไป GitHub

อัปโหลดหรือแทนที่ไฟล์:
- admin.html
- admin.css
- admin.js
- admin-control.js
- firestore.rules

## 2) เพิ่ม Script ใน index.html

เปิด `index.html` แล้วเพิ่มบรรทัดนี้ก่อน `</body>`:

```html
<script type="module" src="./admin-control.js"></script>
```

ให้วางก่อนหรือหลัง `app.js` ก็ได้

## 3) เปิด Email/Password ใน Firebase

Firebase Console → Authentication → Sign-in method → Email/Password → Enable

## 4) สร้างบัญชี Admin

Firebase Console → Authentication → Users → Add user

กรอกอีเมลและรหัสผ่านของผู้จัดงาน แล้วคัดลอกค่า UID ของบัญชีนี้

## 5) ตั้งค่า Firestore Rules

เปิดไฟล์ `firestore.rules` แล้วเปลี่ยน:

```text
REPLACE_WITH_ADMIN_UID
```

เป็น UID ของ Admin จริง เช่น:

```text
abc123xyz789
```

จากนั้นคัดลอก Rules ไปวางที่:
Firebase Console → Firestore Database → Rules → Publish

## 6) เปิดหน้า Admin

```text
https://phusakthan-food-vote.netlify.app/admin.html
```

ล็อกอินด้วยอีเมลและรหัสผ่านที่สร้างไว้

## หมายเหตุด้านความปลอดภัย

ไม่ควรใช้รหัสผ่านที่เขียนไว้ใน JavaScript เพราะผู้ใช้อื่นสามารถเปิดดู Source Code ได้
เวอร์ชันนี้จึงใช้ Firebase Authentication และตรวจ UID ผ่าน Firestore Rules
