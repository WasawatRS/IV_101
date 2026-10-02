'use client';
import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout, PageHead, Stat, Segmented, Caption } from "@/components/ui";
import { NOTES, PATHS, TERMS, INDEX_NOTES, RESEARCH_CAVEAT, pdfHref } from "@/lib/notes";

const ALL = "all";

const SEG_OPTIONS = [
  { value: ALL, label: "ทั้งหมด" },
  ...PATHS.map((p) => ({ value: p.key, label: p.key })),
];

export default function GlossaryPage() {
  const [q, setQ] = useState("");
  const [path, setPath] = useState(ALL);

  const filteredTerms = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TERMS;
    return TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(s) ||
        t.def.toLowerCase().includes(s) ||
        t.ref.toLowerCase().includes(s)
    );
  }, [q]);

  const visible = useMemo(
    () => (path === ALL ? NOTES : NOTES.filter((n) => n.path === path)),
    [path]
  );

  const sel = PATHS.find((p) => p.key === path);

  return (
    <>
      <PageHead
        chapter="คลังอ้างอิง"
        title="ศัพท์และแผนที่โน้ต"
        source="จากโน้ต 23 ฉบับใน obsidian_zone"
      >
        ทุกคำอธิบายสรุปจากโน้ตในโฟลเดอร์ obsidian_zone เปิด PDF ต้นฉบับได้จากแต่ละรายการ
      </PageHead>

      <div className="grid cols-3">
        <Stat label="โน้ตทั้งหมด" value={`${NOTES.length} ฉบับ`} hint="มีไฟล์ PDF ต้นฉบับทุกฉบับ" />
        <Stat label="ศัพท์หลัก" value={`${TERMS.length} คำ`} hint="ค้นหาได้ในข้อ 1" />
        <Stat label="เส้นทางเรียน" value={`${PATHS.length} เส้นทาง`} hint="A · B · C · D · E" />
      </div>

      <h2>1 · ศัพท์หลัก</h2>

      <div className="controls">
        <div className="field">
          <div className="field-head">
            <span>ค้นหาศัพท์</span>
            <span className="v">
              {filteredTerms.length}/{TERMS.length}
            </span>
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="พิมพ์ เช่น IV, Gamma, 0DTE"
            aria-label="ค้นหาศัพท์"
          />
        </div>
      </div>

      {filteredTerms.length === 0 ? (
        <Callout tone="info" title="ไม่พบศัพท์ที่ค้นหา">
          ลองพิมพ์คำอื่น หรือล้างคำค้นเพื่อดูศัพท์ทั้ง {TERMS.length} คำ
        </Callout>
      ) : (
        <div className="grid cols-2">
          {filteredTerms.map((t) => (
            <div className="card" key={t.term}>
              <h4>{t.term}</h4>
              <p>{t.def}</p>
              <p>
                <strong>อ่านเพิ่ม:</strong> {t.ref}
              </p>
            </div>
          ))}
        </div>
      )}

      <Caption>
        ตารางศัพท์เดิมของแอป มี {TERMS.length} คำ เรียงตามที่เรียงในโน้ต ทุกคำอ้างกลับไปที่โน้ตต้นทาง
      </Caption>

      <h2>2 · เส้นทางเรียน A–E</h2>

      <div className="grid cols-3">
        {PATHS.map((p) => (
          <div className="card" key={p.key}>
            <h4>{p.label}</h4>
            {p.label.endsWith(p.desc) ? null : <p>{p.desc}</p>}
            <p>
              รวบรวมโน้ต {NOTES.filter((n) => n.path === p.key).length} ฉบับ
            </p>
          </div>
        ))}
      </div>

      <Callout tone="warn" title="ข้อจำกัดการอ่านงานวิจัย">
        {RESEARCH_CAVEAT}
      </Callout>

      <h2>3 · โน้ตทั้ง 23 ฉบับ</h2>

      <div className="controls">
        <Segmented label="เส้นทาง" options={SEG_OPTIONS} value={path} onChange={setPath} />
      </div>

      <Caption>
        แสดง {visible.length} จาก {NOTES.length} ฉบับ{sel ? ` · ${sel.label}` : ""}
      </Caption>

      {visible.length === 0 ? (
        <Callout tone="info">
          ยังไม่ได้เลือกเส้นทางใด ลองเลือกอย่างน้อยหนึ่งเส้นทางด้านบน
        </Callout>
      ) : (
        <div className="grid cols-2">
          {visible.map((n) => (
            <a
              className="card"
              key={n.no}
              href={pdfHref(n.pdf)}
              target="_blank"
              rel="noreferrer"
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <h4>
                    <span className="tag" style={{ marginRight: 8 }}>
                      {n.path}
                    </span>
                    {String(n.no).padStart(2, "0")} · {n.title}
                  </h4>
                  <p>{n.summary}</p>
                  {n.caveat ? (
                    <p>
                      <strong>ข้อจำกัด:</strong> {n.caveat}
                    </p>
                  ) : null}
                </div>
                <span className="btn ghost">เปิด PDF</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <Caption>
        ทุกการ์ดชี้ไปที่ไฟล์จริงใน <code>/pdf/</code> เปิดในแท็บใหม่ ตัวเลข ข้อจำกัด และคำอธิบาย
        มาจาก <code>glossary.py</code> โดยไม่ได้แก้ไข
      </Caption>

      <div className="divider" />

      <h2>4 · โน้ตสารบัญ 00-xxx</h2>

      <Caption>โน้ตหน้าแรกของ obsidian_zone ที่ไม่มีไฟล์ PDF</Caption>

      <div className="grid cols-3">
        {INDEX_NOTES.map((n) => (
          <div className="card" key={n.note}>
            <h4>{n.title}</h4>
            <p>
              <code>{n.note}.md</code>
            </p>
          </div>
        ))}
      </div>

      <div className="linkrow">
        <Link className="btn" href="/">
          กลับหน้าแรก
        </Link>
        <Link className="btn ghost" href="/greeks/">
          กลับไปบท Greeks
        </Link>
      </div>

      <p className="small">
        ต้นฉบับ: <code>app_pages/glossary.py</code> และโน้ต{" "}
        <code>obsidian_zone/*.md</code> ทั้ง 23 ฉบับ + โน้ตสารบัญ 3 ฉบับ
      </p>
    </>
  );
}
