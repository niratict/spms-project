// src/components/layout/Layout.jsx
import Navbar from "./Navbar";

/**
 * คอมโพเนนต์หลักสำหรับโครงสร้างเลย์เอาท์ของแอปพลิเคชัน
 * ประกอบด้วย Navbar และพื้นที่สำหรับแสดงเนื้อหา (children)
 *
 * @param {React.ReactNode} children - เนื้อหาที่จะแสดงภายในเลย์เอาท์
 * @returns {JSX.Element} โครงสร้างเลย์เอาท์หลักของแอปพลิเคชัน
 */
export default function Layout({ children }) {
  // ===============================================
  // โครงสร้างหลักของเลย์เอาท์
  // ===============================================
  return (
    <div className="min-h-screen bg-gray-100" data-cy="main-layout">
      {/* ส่วนของ Navbar ด้านบน */}
      <Navbar />

      {/* 
        ส่วนของเนื้อหาหลัก (main content)
        - ใช้ flex-1 เพื่อให้ขยายเต็มพื้นที่ที่เหลือ
        - มีการเพิ่ม padding รอบข้าง
      */}
      <main className="flex-1 p-6" data-cy="main-content">
        {/* 
          Container สำหรับจำกัดความกว้างของเนื้อหา
          - max-w-7xl กำหนดความกว้างสูงสุด
          - mx-auto จัดให้อยู่ตรงกลาง
        */}
        <div className="mx-auto max-w-7xl" data-cy="content-container">
          {children}
        </div>
      </main>
    </div>
  );
}
