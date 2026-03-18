import { Metadata } from "next";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว (Privacy Policy) | Asthma Flow",
  description: "นโยบายความเป็นส่วนตัวของแพลตฟอร์ม Asthma Flow",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="space-y-8 bg-card p-8 rounded-xl border-2 border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
          <p className="text-muted-foreground text-sm font-medium">ปรับปรุงล่าสุด: {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. บทนำ</h2>
            <p>
              เว็บไซต์ Asthma Flow ให้ความสำคัญอย่างยิ่งกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน 
              นโยบายความเป็นส่วนตัวนี้จัดทำขึ้นเพื่อให้ท่านทราบถึงวิธีการที่เราเก็บรวบรวม ใช้ เปิดเผย 
              และปกป้องข้อมูลส่วนบุคคลของท่าน ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม</h2>
            <p>เราอาจเก็บรวบรวมข้อมูลส่วนบุคคลของท่าน ดังต่อไปนี้:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">ข้อมูลระบุตัวตน:</strong> เช่น ชื่อ-นามสกุล, วันเดือนปีเกิด</li>
              <li><strong className="text-foreground">ข้อมูลการติดต่อ:</strong> เช่น อีเมล, เบอร์โทรศัพท์</li>
              <li><strong className="text-foreground">ข้อมูลสุขภาพ (สำหรับผู้ป่วย):</strong> เช่น ข้อมูลอาการหอบหืด, ผลการวัด PEFR, ประวัติการใช้ยา</li>
              <li><strong className="text-foreground">ข้อมูลทางเทคนิค:</strong> เช่น หมายเลข IP Address, ประเภทของเบราว์เซอร์, ข้อมูลคุกกี้ (Cookies)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. วัตถุประสงค์ในการประมวลผลข้อมูล</h2>
            <p>เราเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>เพื่อให้การบริการทางการแพทย์และการติดตามอาการโรคหอบหืดดำเนินไปอย่างมีประสิทธิภาพ</li>
              <li>เพื่อการติดต่อสื่อสารและการแจ้งเตือนที่เกี่ยวข้องกับการรักษา</li>
              <li>เพื่อปรับปรุงพัฒนาเว็บไซต์และบริการของเราให้ดียิ่งขึ้น</li>
              <li>เพื่อปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้อง</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. การเปิดเผยข้อมูลส่วนบุคคล</h2>
            <p>
              เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลที่สาม เว้นแต่จะได้รับความยินยอมจากท่าน 
              หรือเป็นไปตามที่กฎหมายกำหนด (เช่น การเปิดเผยให้แก่บุคลากรทางการแพทย์ที่เกี่ยวข้องโดยตรงกับการรักษาของท่าน)
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. สิทธิของเจ้าของข้อมูล (Data Subject Rights)</h2>
            <p>ตามกฎหมาย PDPA ท่านมีสิทธิในข้อมูลส่วนบุคคลของท่าน ดังนี้:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>สิทธิในการเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคล</li>
              <li>สิทธิในการขอแก้ไขข้อมูลส่วนบุคคลให้ถูกต้อง</li>
              <li>สิทธิในการขอให้ลบ หรือทำลายข้อมูล (Right to be forgotten)</li>
              <li>สิทธิในการระงับการใช้ข้อมูล</li>
              <li>สิทธิในการคัดค้านการประมวลผลข้อมูล</li>
              <li>สิทธิในการขอถอนความยินยอม</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. การรักษาความมั่นคงปลอดภัย</h2>
            <p>
              เรามีมาตรการรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคลที่เหมาะสม เพื่อป้องกันการสูญหาย เข้าถึง 
              ใช้ เปลี่ยนแปลง แก้ไข หรือเปิดเผยข้อมูลส่วนบุคคลโดยปราศจากอำนาจหรือโดยมิชอบ
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. ข้อมูลการติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)</h2>
            <p>
              หากท่านมีข้อสงสัยหรือต้องการใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคล โปรดติดต่อ:<br />
              <strong>อีเมล:</strong> dpo@asthmaflow.com<br />
              <strong>ที่อยู่:</strong> คลินิก Asthma Flow
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
