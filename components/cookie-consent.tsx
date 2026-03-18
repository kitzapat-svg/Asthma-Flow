"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [performanceCookies, setPerformanceCookies] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ strictlyNecessary: true, performance: true })
    );
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ strictlyNecessary: true, performance: performanceCookies })
    );
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
    // Note: In strict compliance, closing might just hide it for the session
    // Or we could implicitly consider it as declining optional cookies.
    // For now, let's just save strictly necessary to not show again.
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ strictlyNecessary: true, performance: false })
    );
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t-2 border-border bg-background/95 backdrop-blur-sm p-4 md:p-6 shadow-lg">
      <div className="mx-auto max-w-7xl flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🍪 ยอมรับคุกกี้และนโยบายความเป็นส่วนตัว ?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            เว็บไซต์ จะนำข้อมูลที่ “คุกกี้” ได้บันทึกหรือเก็บรวบรวมไว้ ไปใช้ในการวิเคราะห์เชิงสถิติ หรือในกิจกรรมอื่นของ เว็บไซต์ เพื่อ ปรับปรุงคุณภาพการให้บริการของ เว็บไซต์{" "}
            <Link href="/privacy" className="text-primary hover:underline font-semibold">
              อ่านเพิ่มเติม
            </Link>
          </p>
        </div>

        {showSettings && (
          <div className="mt-4 border-t-2 border-border pt-4 flex flex-col gap-6">
            <p className="text-sm font-semibold">
              คุณสามารถเลือกการตั้งค่าคุกกี้แต่ละประเภทได้ตามความต้องการ ยกเว้น! คุกกี้ที่จำเป็น
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Checkbox id="strictly" checked disabled className="mt-1" />
                <div className="grid gap-1.5">
                  <Label htmlFor="strictly" className="font-bold">
                    คุกกี้ที่มีความจำเป็น (Strictly Necessary Cookies)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    คุกกี้ประเภทนี้มีความจำเป็นต่อการให้บริการเว็บไซต์ เพื่อให้ท่านสามารถเข้าใช้งานในส่วนต่าง ๆ ของเว็บไซต์ได้รวมถึงช่วยจดจำข้อมูลที่ท่านเคยให้ไว้ผ่านเว็บไซต์ การปิดการใช้งานคุกกี้ประเภทนี้จะส่งผลให้ท่านไม่สามารถใช้บริการในสาระสำคัญของ ซึ่งจำเป็นต้องเรียกใช้คุกกี้ได้
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="performance"
                  checked={performanceCookies}
                  onCheckedChange={(checked: boolean | "indeterminate") => setPerformanceCookies(checked === true)}
                  className="mt-1"
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="performance" className="font-bold">
                    คุกกี้เพื่อการวิเคราะห์และประเมินผลการใช้งาน (Performance Cookies)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    คุกกี้ประเภทนี้ช่วยให้ ทราบถึงการปฏิสัมพันธ์ของผู้ใช้งาน ในการใช้บริการเว็บไซต์ รวมถึงหน้าเพจหรือพื้นที่ใดของเว็บไซต์ที่ได้รับความนิยม ตลอดจนการวิเคราะห์ข้อมูลด้านอื่น ๆ ยังใช้ข้อมูลนี้เพื่อการปรับปรุงการทำงานของเว็บไซต์ และเพื่อเข้าใจพฤติกรรมของผู้ใช้งานมากขึ้น ถึงแม้ว่าข้อมูลที่คุกกี้นี้เก็บรวบรวมจะเป็นข้อมูลที่ไม่สามารถระบุตัวตนได้ และนำมาใช้วิเคราะห์ทางสถิติเท่านั้น การปิดการใช้งานคุกกี้ประเภทนี้จะส่งผลให้ ไม่สามารถทราบปริมาณผู้เข้าเยี่ยมชมเว็บไซต์ และไม่สามารถประเมินคุณภาพการให้บริการได้
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 mt-2">
          <Button variant="outline" onClick={handleClose} className="font-bold">
            ปิด
          </Button>
          {!showSettings ? (
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="font-bold"
            >
              ตั้งค่า
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleSaveSettings}
              className="font-bold"
            >
              บันทึกการตั้งค่า
            </Button>
          )}
          <Button onClick={handleAcceptAll} className="bg-[#8fc3a3] hover:bg-[#7db692] text-primary-foreground font-bold">
            ยอมรับคุกกี้
          </Button>
        </div>
      </div>
    </div>
  );
}
