// ระบบจัดการ Error แบบครอบคลุมและแม่นยำ
const ErrorHandler = {
    // หมวดหมู่ Error หลัก (ครอบคลุมและขยาย)
    categories: {
      CYPRESS: "Cypress Test Error",
      NETWORK: "เครือข่าย/การเชื่อมต่อ",
      ASSERTION: "ข้อผิดพลาดในการตรวจสอบ",
      ELEMENT: "ปัญหาการค้นหาหรือโต้ตอบกับองค์ประกอบ",
      FIXTURE: "ปัญหาไฟล์ fixture",
      AUTHENTICATION: "ข้อผิดพลาดการตรวจสอบสิทธิ์",
      ASYNC: "ปัญหาการทำงานแบบอะซิงโครนัส",
      CONFIG: "ปัญหาการกำหนดค่าคอนฟิก",
      STUB_SPY: "ปัญหา Stub หรือ Spy",
      DOM: "ปัญหาการจัดการ DOM",
      PERFORMANCE: "ปัญหาประสิทธิภาพ",
      CSS: "ปัญหาการจัดการ CSS",
      API: "ปัญหาการเรียก API",
      ROUTE: "ปัญหาการกำหนด Route",
      UNKNOWN: "ข้อผิดพลาดที่ไม่รู้จัก",
    },
  
    // รายละเอียด Error เฉพาะ (เพิ่มความครอบคลุม)
    errorPatterns: [
      // Cypress Type Errors
      {
        pattern: /cy\.type\(\)\s*can only accept a string or number/i,
        category: "CYPRESS",
        translation: "ฟังก์ชัน cy.type() รับเฉพาะข้อความหรือตัวเลข",
        recommendation: "ตรวจสอบการส่งค่าให้ cy.type() เป็นสตริงหรือตัวเลข",
        severity: "สูง",
      },
      {
        pattern: /cy\.type\(\) can only be called on a valid DOM element/i,
        category: "ELEMENT",
        translation: "ไม่สามารถใช้ cy.type() กับองค์ประกอบที่ไม่ถูกต้อง",
        recommendation: "ตรวจสอบ selector และสถานะขององค์ประกอบ",
        severity: "สูง",
      },
  
      // Fixture Errors
      {
        pattern: /A fixture file could not be found at .+/i,
        category: "FIXTURE",
        translation: "ไม่พบไฟล์ fixture",
        recommendation: "ตรวจสอบพาธ, ชื่อไฟล์ fixture และการกำหนดค่า",
        severity: "สูง",
      },
      {
        pattern: /Fixture file .+ cannot be parsed/i,
        category: "FIXTURE",
        translation: "ไม่สามารถแปลงไฟล์ fixture",
        recommendation: "ตรวจสอบรูปแบบและเนื้อหาของไฟล์ fixture",
        severity: "สูง",
      },
  
      // Network & API Errors (ขยายการตรวจจับ)
      {
        pattern: /failed to fetch/i,
        category: "NETWORK",
        translation: "การเรียกข้อมูลล้มเหลว",
        recommendation: "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต URL และ API",
        severity: "สูง",
      },
      {
        pattern: /Request failed with status code/i,
        category: "NETWORK",
        translation: "การร้องขอเครือข่ายล้มเหลว",
        recommendation: "ตรวจสอบ URL, พารามิเตอร์ และสถานะเซิร์ฟเวอร์",
        severity: "สูง",
      },
      {
        pattern: /No request ever occurred/i,
        category: "ROUTE",
        translation: "ไม่สามารถเรียก Route หรือ API ได้",
        recommendation:
          "ตรวจสอบการกำหนด Route, การเชื่อมต่อเครือข่าย และสถานะของ API",
        severity: "สูง",
      },
  
      // Element Interaction Errors
      {
        pattern: /Element .+ not found/i,
        category: "ELEMENT",
        translation: "ไม่พบองค์ประกอบที่ระบุ",
        recommendation: "ตรวจสอบ selector, สถานะ และการโหลดหน้าเว็บ",
        severity: "สูง",
      },
      {
        pattern: /Expected to find element/i,
        category: "ELEMENT",
        translation: "ไม่พบองค์ประกอบที่คาดหวัง",
        recommendation: "ตรวจสอบ selector, โครงสร้าง DOM และสถานะการโหลดหน้า",
        severity: "สูง",
      },
      {
        pattern: /element is not visible/i,
        category: "DOM",
        translation: "องค์ประกอบไม่แสดงผล",
        recommendation: "ตรวจสอบ CSS, การซ่อน/แสดงองค์ประกอบ และการโต้ตอบ",
        severity: "ปานกลาง",
      },
      {
        pattern: /visibility:\s*hidden/i,
        category: "CSS",
        translation: "องค์ประกอบถูกซ่อนด้วย CSS",
        recommendation: "ตรวจสอบ CSS การซ่อน/แสดงผล และเงื่อนไขการแสดงผล",
        severity: "ปานกลาง",
      },
      {
        pattern: /element is not in an interactable state/i,
        category: "DOM",
        translation: "ไม่สามารถโต้ตอบกับองค์ประกอบได้",
        recommendation: "ตรวจสอบสถานะ, การซ่อน/แสดง และเงื่อนไขขององค์ประกอบ",
        severity: "สูง",
      },
  
      // Assertion Errors (ขยายการตรวจจับ)
      {
        pattern: /expected .+ to contain/i,
        category: "ASSERTION",
        translation: "เนื้อหาไม่ตรงตามที่คาดหวัง",
        recommendation: "ตรวจสอบเนื้อหา การดึงข้อมูล และเงื่อนไขการแสดงผล",
        severity: "ปานกลาง",
      },
      {
        pattern: /expected .+ to match/i,
        category: "ASSERTION",
        translation: "รูปแบบข้อมูลไม่ตรงตามที่คาดหวัง",
        recommendation: "ตรวจสอบรูปแบบข้อมูล การฟอร์แมตข้อความ และการตรวจสอบ",
        severity: "ปานกลาง",
      },
      {
        pattern: /to have class/i,
        category: "CSS",
        translation: "องค์ประกอบขาด CSS Class ที่คาดหวัง",
        recommendation: "ตรวจสอบการใช้งาน CSS class และเงื่อนไขการใช้งาน",
        severity: "ต่ำ",
      },
  
      // Authentication Errors
      {
        pattern: /Unauthorized/i,
        category: "AUTHENTICATION",
        translation: "ไม่ได้รับอนุญาต",
        recommendation: "ตรวจสอบสิทธิ์การเข้าถึงและข้อมูลประจำตัว",
        severity: "สูง",
      },
  
      // Async and JavaScript Errors
      {
        pattern: /undefined is not a function/i,
        category: "ASYNC",
        translation: "ฟังก์ชันไม่ถูกกำหนด",
        recommendation: "ตรวจสอบการนำเข้าและการใช้งานฟังก์ชัน",
        severity: "สูง",
      },
      {
        pattern: /Cannot read propert(y|ies) of undefined/i,
        category: "ASYNC",
        translation: "พยายามเข้าถึงคุณสมบัติของค่าที่ยังไม่ถูกกำหนด",
        recommendation: "ตรวจสอบการกำหนดค่าตัวแปรและการเรียกใช้งาน",
        severity: "สูง",
      },
      {
        pattern: /val is not a function/i,
        category: "ASYNC",
        translation: "เรียกใช้เมธอดที่ไม่มีอยู่",
        recommendation: "ตรวจสอบชนิดของออบเจ็กต์และเมธอดที่ใช้",
        severity: "สูง",
      },
  
      // Cypress Command Errors
      {
        pattern: /cy\.[a-z]+ failed because/i,
        category: "CYPRESS",
        translation: "คำสั่ง Cypress ล้มเหลว",
        recommendation: "ตรวจสอบการใช้งานคำสั่ง Cypress และสภาพแวดล้อม",
        severity: "สูง",
      },
  
      // Configuration Errors
      {
        pattern: /Configuration file not found/i,
        category: "CONFIG",
        translation: "ไม่พบไฟล์คอนฟิก",
        recommendation: "ตรวจสอบการตั้งค่าและเส้นทางไฟล์คอนฟิก",
        severity: "สูง",
      },
      {
        pattern: /Invalid configuration/i,
        category: "CONFIG",
        translation: "การกำหนดค่าไม่ถูกต้อง",
        recommendation: "ตรวจสอบไฟล์คอนฟิกและการตั้งค่าทั้งหมด",
        severity: "สูง",
      },
      {
        pattern: /opacity:\s*0/i,
        category: "CSS",
        translation: "องค์ประกอบถูกซ่อนด้วย CSS",
        recommendation: "ตรวจสอบการใช้ CSS opacity และเงื่อนไขการแสดงผล",
        severity: "ปานกลาง",
      },
      {
        pattern: /but it was continuously found/i,
        category: "DOM",
        translation: "องค์ประกอบยังคงอยู่ในโครงสร้าง DOM",
        recommendation: "ตรวจสอบการสร้าง/ทำลายองค์ประกอบ และเงื่อนไขการแสดงผล",
        severity: "ปานกลาง",
      },
      {
        pattern: /Timed out retrying after .+ not to exist/i,
        category: "DOM",
        translation: "องค์ประกอบไม่หายไปจาก DOM ตามที่คาดหวัง",
        recommendation: "ตรวจสอบการลบหรือซ่อนองค์ประกอบ",
        severity: "ปานกลาง",
      },
      {
        pattern:
          /cy\.type\(\) can only accept a string or number. You passed in: undefined/i,
        category: "ASYNC",
        translation: "ส่งค่าที่ไม่ถูกต้องให้กับ cy.type()",
        recommendation: "ตรวจสอบและกำหนดค่าตัวแปรก่อนใช้ cy.type()",
        severity: "สูง",
      },
  
      // เพิ่ม Patterns สำหรับการค้นหาองค์ประกอบ
      {
        pattern: /Expected to find element:.+but never found it/i,
        category: "ELEMENT",
        translation: "ไม่พบองค์ประกอบตาม Selector",
        recommendation: "ตรวจสอบ Selector, โครงสร้าง DOM และสถานะการโหลดหน้า",
        severity: "สูง",
      },
  
      // เพิ่ม Patterns สำหรับ Fixture
      {
        pattern: /A fixture file could not be found at .+/i,
        category: "FIXTURE",
        translation: "ไม่พบไฟล์ Fixture",
        recommendation: "ตรวจสอบเส้นทาง, ชื่อไฟล์ และการกำหนดค่า Fixture",
        severity: "สูง",
      },
  
      // เพิ่ม Patterns สำหรับปัญหา DOM ที่ไม่หายไป
      {
        pattern:
          /Expected .+ not to exist in the DOM, but it was continuously found/i,
        category: "DOM",
        translation: "องค์ประกอบยังคงอยู่ใน DOM นานเกินไป",
        recommendation: "ตรวจสอบการซ่อน/ลบองค์ประกอบและเงื่อนไขการทำงาน",
        severity: "ปานกลาง",
      },
      // เพิ่ม Pattern สำหรับ Cypress Type Error
      {
        pattern:
          /CypressError:\s*`cy\.type\(\)`\s*can only accept a string or number\.\s*You passed in:\s*`undefined`/i,
        category: "ASYNC",
        translation: "ค่าที่ส่งให้ cy.type() เป็น undefined",
        recommendation: "ตรวจสอบและกำหนดค่าตัวแปรก่อนใช้งาน cy.type()",
        severity: "สูง",
      },
      {
        pattern:
          /AssertionError:\s*Timed out retrying after .+:\s*expected.+not to be 'visible'/i,
        category: "DOM",
        translation: "องค์ประกอบมีปัญหาการแสดงผล",
        recommendation: "ตรวจสอบเงื่อนไขการแสดงผล CSS transforms และ opacity",
        severity: "ปานกลาง",
        details: [
          "ตรวจสอบ CSS transforms (scale, opacity)",
          "ตรวจสอบเงื่อนไขการแสดงผลขององค์ประกอบ",
          "ตรวจสอบการทำงานของ JavaScript ที่มีผลต่อการแสดงผล",
          "ใช้ {force: true} หรือรอให้องค์ประกอบแสดงผลอย่างสมบูรณ์",
        ],
      },
  
      // Pattern สำหรับ opacity 0
      {
        pattern: /opacity:\s*0/i,
        category: "CSS",
        translation: "องค์ประกอบถูกซ่อนด้วย CSS opacity",
        recommendation: "ตรวจสอบการใช้ CSS opacity และเงื่อนไขการแสดงผล",
        severity: "ปานกลาง",
        details: [
          "ตรวจสอบ CSS ที่กำหนด opacity",
          "ตรวจสอบเงื่อนไขการเปลี่ยนแปลง opacity",
          "ใช้การดีบั๊กเพื่อตรวจสอบสถานะ CSS",
        ],
      },
  
      // Pattern สำหรับ scale transforms
      {
        pattern: /scale-[0-9]+/i,
        category: "CSS",
        translation: "องค์ประกอบถูกซ่อนด้วย CSS scale transform",
        recommendation: "ตรวจสอบการใช้ CSS transform และเงื่อนไขการแสดงผล",
        severity: "ปานกลาง",
        details: [
          "ตรวจสอบ CSS transforms",
          "ตรวจสอบเงื่อนไขการเปลี่ยนแปลงขนาด",
          "ใช้การดีบั๊กเพื่อตรวจสอบสถานะ transforms",
        ],
      },
    ],
  
    // คำแนะนำเพิ่มเติมสำหรับข้อผิดพลาดเฉพาะ
    additionalRecommendations: {
      undefined: "ตรวจสอบให้แน่ใจว่าได้กำหนดค่าตัวแปรก่อนใช้งาน",
      "cy.type()": "ตรวจสอบข้อมูลที่กำลังป้อนเข้าสู่ฟิลด์กรอกข้อมูล",
      "fixture file": "ตรวจสอบเส้นทางของไฟล์ fixture และยืนยันว่าไฟล์มีอยู่จริง",
      "Cannot read": "ตรวจสอบว่าออบเจ็กต์หรือตัวแปรถูกประกาศและมีค่าถูกต้อง",
      "Request failed": "ตรวจสอบ URL, การเชื่อมต่อเครือข่าย และการตั้งค่า API",
      stub: "ตรวจสอบการกำหนด stub และความถูกต้องของการใช้งาน",
      network: "ตรวจสอบการเชื่อมต่อ, URL และสถานะเซิร์ฟเวอร์",
    },
  
    // ฟังก์ชันวิเคราะห์ Error ที่มีประสิทธิภาพมากขึ้น
    parseError(err) {
      if (!err) {
        return {
          category: this.categories.UNKNOWN,
          translation: "ไม่พบข้อผิดพลาด",
          recommendation: "ตรวจสอบโค้ดและขั้นตอนการทดสอบ",
          severity: "ต่ำ",
        };
      }
  
      const errorMessage =
        typeof err === "string"
          ? err
          : err.message || err.toString() || JSON.stringify(err);
  
      // ค้นหาแพทเทิร์น Error ที่ตรงกัน โดยเรียงลำดับความเฉพาะเจาะจง
      const matchedError = this.errorPatterns
        .sort((a, b) => b.pattern.source.length - a.pattern.source.length)
        .find((pattern) => pattern.pattern.test(errorMessage));
  
      if (matchedError) {
        return {
          category: this.categories[matchedError.category],
          translation: matchedError.translation,
          recommendation: matchedError.recommendation,
          severity: matchedError.severity || "ปานกลาง",
          originalMessage: errorMessage,
        };
      }
  
      // กรณีไม่พบแพทเทิร์นที่ตรงกัน
      return {
        category: this.categories.UNKNOWN,
        translation: "ข้อผิดพลาดที่ไม่คุ้นเคย",
        recommendation: "ตรวจสอบรายละเอียดข้อผิดพลาดเพิ่มเติม",
        severity: "ต่ำ",
        originalMessage: errorMessage,
      };
    },
  
    // ฟังก์ชันจัดรูปแบบ Error ที่มีรายละเอียดมากขึ้น
    formatError(err) {
      const parsedError = this.parseError(err);
      const additionalRecommendation = this.getErrorRecommendation(err);
  
      return `
          ประเภท: ${parsedError.category}
          ระดับความรุนแรง: ${parsedError.severity}
          ข้อความ: ${parsedError.translation}
          คำแนะนำ: ${parsedError.recommendation}
          ${
            additionalRecommendation
              ? `\nคำแนะนำเพิ่มเติม: ${additionalRecommendation}`
              : ""
          }
        `.trim();
    },
  
    // ฟังก์ชันให้คำแนะนำเพิ่มเติม
    getErrorRecommendation(err) {
      if (!err) return "";
  
      const errorMessage =
        typeof err === "string" ? err : err.message || err.toString();
  
      // ค้นหาคำแนะนำเพิ่มเติมจาก additionalRecommendations
      const matchedRecommendation = Object.entries(
        this.additionalRecommendations
      ).find(([key]) => errorMessage.includes(key));
  
      return matchedRecommendation ? matchedRecommendation[1] : "";
    },
  
    // รวมฟังก์ชันการจัดการ Error เข้าด้วยกัน
    handleError(err) {
      const formattedError = this.formatError(err);
  
      return {
        formattedError,
      };
    },
  };
  
  export default ErrorHandler;
  