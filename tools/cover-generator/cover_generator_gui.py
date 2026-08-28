# -*- coding: utf-8 -*-
import os
import sys
import time
import pathlib
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import openpyxl
from google import genai
from google.genai import types

MODEL_NAME = "gemini-3-pro-image"
DEFAULT_REFERENCE = "reference_saba_morris.png"
DEFAULT_XLSX = "פרומפטים_לתמונות_סבא_שמעון_ומוריס.xlsx"
DEFAULT_OUTPUT = "output_images"
SLEEP_BETWEEN_CALLS_SECONDS = 4

FIXED_BLOCK = (
    "Saba Shimon: a warm, friendly elderly man in his sixties. Short tousled silver-white "
    "hair, thick black rectangular glasses, a neatly trimmed white-gray beard and mustache, "
    "rosy cheeks, and a big genuine smile with warmth in his eyes. He wears a solid "
    "charcoal-black crew-neck T-shirt. Rendered in a polished 3D Pixar/Disney-style animation "
    "look with soft cinematic lighting. His face, proportions, hairstyle, glasses and outfit "
    "must stay PIXEL-IDENTICAL in every image of this series — only his pose, position and "
    "expression may change naturally to fit each story. Morris the mouse: a soft pink plush "
    "hand-puppet mouse character. Oversized round pink ears, a fuzzy gray-pink face, a round "
    "pink nose, big round expressive eyes, and an open cheerful smile. His texture is a soft "
    "knitted/plush felt material like a classic puppet-show puppet. His design, color and texture "
    "must stay PIXEL-IDENTICAL in every image of this series — only his pose, position and "
    "expression may change naturally to fit each story. Use the attached reference image to lock "
    "the exact facial features, proportions, colors and texture of Saba Shimon and Morris — but "
    "feel free to change their pose, position and composition to fit each new story; do not just "
    "copy the reference image's staging."
)


def app_dir():
    if getattr(sys, 'frozen', False):
        return pathlib.Path(sys.executable).parent.resolve()
    return pathlib.Path(__file__).parent.resolve()


def load_rows_from_xlsx(xlsx_path):
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb["פרומפטים לפי ספר"]
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        book_id, name, guest, bg, palette, extra_prompt = row
        if not book_id:
            continue
        rows.append((book_id, name, extra_prompt or ""))
    return rows


def safe_filename(book_id, name):
    keep = "".join(c for c in str(name) if c.isalnum() or c in " _-")
    return f"{book_id}_{keep.strip().replace(' ', '_')}.png"


class CoverGeneratorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("יצירת כריכות - סבא שמעון")
        self.geometry("860x650")
        self.minsize(760, 560)
        self.configure(bg="#f6f1e7")
        self.stop_requested = False

        base = app_dir()
        self.api_var = tk.StringVar(value=os.environ.get("GEMINI_API_KEY", ""))
        self.ref_var = tk.StringVar(value=str(base / DEFAULT_REFERENCE))
        self.xlsx_var = tk.StringVar(value=str(base / DEFAULT_XLSX))
        self.output_var = tk.StringVar(value=str(base / DEFAULT_OUTPUT))
        self.model_var = tk.StringVar(value=MODEL_NAME)
        self.status_var = tk.StringVar(value="מוכן")
        self.progress_var = tk.DoubleVar(value=0)

        self._build_ui()

    def _build_ui(self):
        style = ttk.Style(self)
        try:
            style.theme_use("vista")
        except Exception:
            pass

        root = ttk.Frame(self, padding=20)
        root.pack(fill="both", expand=True)

        ttk.Label(root, text="מחולל הכריכות של סבא שמעון", font=("Arial", 18, "bold")).pack(anchor="e")
        ttk.Label(root, text="Gemini API · יצירת כריכות באצווה עם תמונת ייחוס קבועה", font=("Arial", 10)).pack(anchor="e", pady=(4, 16))

        form = ttk.Frame(root)
        form.pack(fill="x")

        self._row(form, 0, "מפתח Gemini API", self.api_var, password=True)
        self._row(form, 1, "תמונת ייחוס", self.ref_var, browse=self._browse_ref)
        self._row(form, 2, "קובץ Excel", self.xlsx_var, browse=self._browse_xlsx)
        self._row(form, 3, "תיקיית פלט", self.output_var, browse=self._browse_output)

        ttk.Label(form, text="מודל", font=("Arial", 10, "bold")).grid(row=4, column=2, sticky="e", padx=(10, 0), pady=6)
        model_combo = ttk.Combobox(form, textvariable=self.model_var, values=["gemini-3-pro-image", "gemini-3.1-flash-image"], state="readonly", width=34)
        model_combo.grid(row=4, column=0, columnspan=2, sticky="ew", pady=6)

        form.columnconfigure(0, weight=1)

        actions = ttk.Frame(root)
        actions.pack(fill="x", pady=16)
        self.start_btn = ttk.Button(actions, text="התחל יצירת כריכות", command=self._start)
        self.start_btn.pack(side="right", padx=(8, 0))
        self.stop_btn = ttk.Button(actions, text="עצור אחרי הספר הנוכחי", command=self._request_stop, state="disabled")
        self.stop_btn.pack(side="right")
        ttk.Button(actions, text="פתח תיקיית פלט", command=self._open_output).pack(side="left")

        ttk.Progressbar(root, maximum=100, variable=self.progress_var).pack(fill="x")
        ttk.Label(root, textvariable=self.status_var).pack(anchor="e", pady=(6, 10))

        log_frame = ttk.LabelFrame(root, text="יומן עבודה", padding=8)
        log_frame.pack(fill="both", expand=True)
        self.log = tk.Text(log_frame, wrap="word", height=18, font=("Consolas", 10))
        self.log.pack(fill="both", expand=True)
        self.log.configure(state="disabled")

    def _row(self, parent, row, label, var, browse=None, password=False):
        ttk.Label(parent, text=label, font=("Arial", 10, "bold")).grid(row=row, column=2, sticky="e", padx=(10, 0), pady=6)
        entry = ttk.Entry(parent, textvariable=var, show="*" if password else "")
        entry.grid(row=row, column=0, sticky="ew", pady=6)
        if browse:
            ttk.Button(parent, text="בחר...", command=browse, width=10).grid(row=row, column=1, padx=8, pady=6)
        else:
            ttk.Label(parent, text="", width=10).grid(row=row, column=1)

    def _browse_ref(self):
        p = filedialog.askopenfilename(filetypes=[("PNG/JPG", "*.png *.jpg *.jpeg"), ("All files", "*.*")])
        if p: self.ref_var.set(p)

    def _browse_xlsx(self):
        p = filedialog.askopenfilename(filetypes=[("Excel", "*.xlsx"), ("All files", "*.*")])
        if p: self.xlsx_var.set(p)

    def _browse_output(self):
        p = filedialog.askdirectory()
        if p: self.output_var.set(p)

    def _open_output(self):
        p = pathlib.Path(self.output_var.get())
        p.mkdir(parents=True, exist_ok=True)
        os.startfile(str(p))

    def _append(self, text):
        self.log.configure(state="normal")
        self.log.insert("end", text + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def _set_running(self, running):
        self.start_btn.configure(state="disabled" if running else "normal")
        self.stop_btn.configure(state="normal" if running else "disabled")

    def _request_stop(self):
        self.stop_requested = True
        self.status_var.set("בקשת עצירה התקבלה — נעצור אחרי הספר הנוכחי")

    def _validate(self):
        if not self.api_var.get().strip():
            raise ValueError("יש להזין מפתח Gemini API")
        if not pathlib.Path(self.ref_var.get()).exists():
            raise FileNotFoundError("תמונת הייחוס לא נמצאה")
        if not pathlib.Path(self.xlsx_var.get()).exists():
            raise FileNotFoundError("קובץ האקסל לא נמצא")

    def _start(self):
        try:
            self._validate()
        except Exception as e:
            messagebox.showerror("שגיאה", str(e))
            return
        self.stop_requested = False
        self.progress_var.set(0)
        self._set_running(True)
        threading.Thread(target=self._run_batch, daemon=True).start()

    def _run_batch(self):
        try:
            api_key = self.api_var.get().strip()
            ref_path = pathlib.Path(self.ref_var.get())
            xlsx_path = pathlib.Path(self.xlsx_var.get())
            output_dir = pathlib.Path(self.output_var.get())
            output_dir.mkdir(parents=True, exist_ok=True)

            client = genai.Client(api_key=api_key)
            mime = "image/png" if ref_path.suffix.lower() == ".png" else "image/jpeg"
            reference_part = types.Part.from_bytes(data=ref_path.read_bytes(), mime_type=mime)
            rows = load_rows_from_xlsx(xlsx_path)
            total = len(rows)
            self.after(0, self._append, f"נמצאו {total} ספרים.")
            successes, failures, skipped = [], [], []

            for i, (book_id, name, extra_prompt) in enumerate(rows, start=1):
                if self.stop_requested:
                    break
                out_path = output_dir / safe_filename(book_id, name)
                if out_path.exists():
                    skipped.append(book_id)
                    self.after(0, self._append, f"[{i}/{total}] {name}: כבר קיים — מדלג")
                    self.after(0, self.progress_var.set, i * 100 / total)
                    continue

                self.after(0, self.status_var.set, f"יוצר: {name} ({i}/{total})")
                self.after(0, self._append, f"[{i}/{total}] {book_id} - {name}: שולח בקשה...")
                saved = False
                for attempt in range(1, 3):
                    try:
                        response = client.models.generate_content(
                            model=self.model_var.get(),
                            contents=[reference_part, f"{FIXED_BLOCK} {extra_prompt}"],
                            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
                        )
                        candidates = getattr(response, "candidates", None)
                        if not candidates:
                            self.after(0, self._append, f"    ניסיון {attempt}: לא התקבלה תמונה")
                            continue
                        parts = getattr(candidates[0].content, "parts", None) if candidates[0].content else None
                        if not parts:
                            self.after(0, self._append, f"    ניסיון {attempt}: תגובה ריקה")
                            continue
                        for part in parts:
                            if getattr(part, "inline_data", None) is not None:
                                out_path.write_bytes(part.inline_data.data)
                                successes.append(book_id)
                                saved = True
                                self.after(0, self._append, f"    נשמר: {out_path.name}")
                                break
                        if saved:
                            break
                    except Exception as e:
                        self.after(0, self._append, f"    ניסיון {attempt}: {e}")
                    time.sleep(SLEEP_BETWEEN_CALLS_SECONDS)

                if not saved:
                    failures.append(book_id)
                self.after(0, self.progress_var.set, i * 100 / total)
                time.sleep(SLEEP_BETWEEN_CALLS_SECONDS)

            summary = f"הסתיים. הצליחו: {len(successes)} | דולגו: {len(skipped)} | נכשלו: {len(failures)}"
            self.after(0, self.status_var.set, summary)
            self.after(0, self._append, "--- סיכום ---")
            self.after(0, self._append, summary)
            if failures:
                self.after(0, self._append, f"נכשלו: {failures}")
        except Exception as e:
            self.after(0, messagebox.showerror, "שגיאה", str(e))
            self.after(0, self.status_var.set, "ההרצה נעצרה עקב שגיאה")
        finally:
            self.after(0, self._set_running, False)


if __name__ == "__main__":
    CoverGeneratorApp().mainloop()
