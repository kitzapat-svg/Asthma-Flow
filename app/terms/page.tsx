import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ข้อกำหนดและเงื่อนไข (Terms & Conditions) | Asthma Flow",
  description: "ข้อกำหนดและเงื่อนไขการใช้งานแพลตฟอร์ม Asthma Flow",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="space-y-8 bg-card p-8 rounded-xl border-2 border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">ข้อกำหนดและเงื่อนไขการใช้งาน (Terms & Conditions)</h1>
          <p className="text-muted-foreground text-sm font-medium">ปรับปรุงล่าสุด: {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. ข้อตกลงทั่วไป</h2>
            <p>
              ยินดีต้อนรับสู่ Asthma Flow การเข้าถึงหรือใช้งานแพลตฟอร์มนี้ 
              ถือว่าท่านได้อ่าน ทำความเข้าใจ และตกลงยอมรับข้อกำหนดและเงื่อนไขเหล่านี้อย่างครบถ้วน 
              หากท่านไม่เห็นด้วยกับข้อกำหนดและเงื่อนไขเหล่านี้ โปรดงดการใช้งานแพลตฟอร์ม
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. ลักษณะการให้บริการ</h2>
            <p>
              Asthma Flow เป็นแพลตฟอร์มสำหรับจัดการข้อมูลผู้ป่วยโรคหอบหืด การบันทึกอาการ และการประเมิน 
              ข้อมูลและการวิเคราะห์ที่แสดงบนแพลตฟอร์มนี้มีวัตถุประสงค์เพื่อเป็นเครื่องมือสนับสนุนเท่านั้น 
              <strong>ไม่ใช่การทดแทนคำแนะนำ การวินิจฉัย หรือการรักษาทางการแพทย์จากแพทย์ผู้เชี่ยวชาญโดยตรง</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. บัญชีผู้ใช้งานและความรับผิดชอบ</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>ผู้ใช้งานจะต้องให้ข้อมูลที่แท้จริง ถูกต้อง และเป็นปัจจุบันในการลงทะเบียน</li>
              <li>ผู้ใช้งานมีความรับผิดชอบในการรักษาความลับของรหัสผ่านและข้อมูลบัญชีของตนเอง</li>
              <li>ทางเราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชี หากพบว่ามีการกระทำที่ละเมิดข้อกำหนด หรือให้ข้อมูลที่เป็นเท็จ</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. ข้อจำกัดความรับผิด</h2>
            <p>
              ทางเราจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นจากการใช้งาน หรือการไม่สามารถใช้งานแพลตฟอร์มนี้ได้ 
              รวมถึงความผิดพลาด หรือความล่าช้าในการส่งข้อมูล หากท่านมีอาการฉุกเฉินทางการแพทย์ โปรดติดต่อสถานพยาบาล หรือโทร 1669 ทันที
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. ทรัพย์สินทางปัญญา</h2>
            <p>
              เนื้อหา ข้อมูล โลโก้ และซอฟต์แวร์ทั้งหมดที่ปรากฏบนแพลตฟอร์มนี้ เป็นทรัพย์สินทางปัญญาของ Asthma Flow 
              ไม่อนุญาตให้คัดลอก ดัดแปลง หรือนำไปใช้เพื่อการพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. การเปลี่ยนแปลงข้อกำหนดและเงื่อนไข</h2>
            <p>
              เราขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงข้อกำหนดและเงื่อนไขเหล่านี้ได้ตลอดเวลา 
              โดยการเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีเมื่อมีการประกาศบนแพลตฟอร์ม การที่ท่านใช้งานต่อไปถือว่าท่านยอมรับการเปลี่ยนแปลงดังกล่าว
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. กฎหมายที่บังคับใช้</h2>
            <p>
              ข้อกำหนดและเงื่อนไขนี้อยู่ภายใต้บังคับและการตีความตามกฎหมายของประเทศไทย 
              หากมีข้อพิพาทใดๆ ให้อยู่ในอำนาจศาลของประเทศไทย
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
