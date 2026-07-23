# วิธีติดตั้งระบบเปลี่ยนสีเว็บไซต์ V4

## ไฟล์ใหม่
- `theme-control.js` ใช้กับหน้าโหวต
- `admin-theme-section.html` ส่วนที่ต้องเพิ่มในหน้า Admin
- `admin-theme.css` CSS ที่ต้องเพิ่มท้าย `admin.css`
- `admin-theme.js` JavaScript ที่ต้องเพิ่มท้าย `admin.js`
- `firestore.rules` Rules เวอร์ชันรองรับการเปลี่ยนสี

## 1. อัปโหลด `theme-control.js`
อัปโหลดไฟล์นี้ไว้ตำแหน่งเดียวกับ `index.html`

## 2. เพิ่ม Script ใน `index.html`
เพิ่มก่อน `</body>`:

```html
<script type="module" src="./theme-control.js"></script>
```

กรณีมี `admin-control.js` อยู่แล้ว ให้มีทั้งสองบรรทัด:

```html
<script type="module" src="./admin-control.js"></script>
<script type="module" src="./theme-control.js"></script>
```

## 3. เพิ่มส่วนเลือกธีมใน `admin.html`
คัดลอกข้อความทั้งหมดจาก `admin-theme-section.html`
แล้ววางใน `<section id="dashboardView">` ก่อนส่วนปุ่ม Actions หรือก่อนตารางรายการโหวต

## 4. เพิ่ม CSS
คัดลอกข้อความทั้งหมดจาก `admin-theme.css`
แล้ววางต่อท้ายไฟล์ `admin.css`

## 5. เพิ่ม JavaScript
คัดลอกข้อความทั้งหมดจาก `admin-theme.js`
แล้ววางต่อท้ายไฟล์ `admin.js`

> `admin.js` เดิมต้อง import `doc`, `onSnapshot`, `setDoc`, `serverTimestamp` อยู่แล้ว
> ชุด Admin V3 ที่จัดทำก่อนหน้านี้มี import เหล่านี้ครบแล้ว

## 6. เปลี่ยน Firestore Rules
เปิดไฟล์ `firestore.rules` ใน ZIP นี้
เปลี่ยน `REPLACE_WITH_ADMIN_UID` เป็น UID ของ Admin
จากนั้นนำไปวางใน Firebase Console → Firestore Database → Rules → Publish

## 7. การใช้งาน
เข้า:
`https://phusakthan-food-vote.netlify.app/admin.html`

เลือกธีม หรือปรับสีเอง แล้วกด “บันทึกสีเว็บไซต์”
หน้าโหวตของผู้ใช้งานทุกคนจะเปลี่ยนสีแบบ Real-time

## ธีมที่มีให้
- Sunset — ส้มพาสเทล
- Nature — เขียวธรรมชาติ
- Ocean — ฟ้าสดใส
- Royal — ม่วงพรีเมียม
- Rose — ชมพูหวาน
- Luxury — ทองโรงแรม
