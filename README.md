# ROBOMOST Eğitim Takvimi ve Ödeme Planı Oluşturucu

ROBOMOST personeli için geliştirilmiş, öğrenci bazlı **Eğitim Takvimi ve Ödeme Planı** oluşturan
çalışan bir web uygulaması. Veli/öğrenci/program bilgilerini alır, ROBOMOST akademik takvimine göre
gerçek ders tarihlerini ve ödeme son tarihlerini hesaplar, kurumsal görünümlü bir A4 belge üretir ve
bu belgeyi **Veli Nüshası** + **ROBOMOST Nüshası** olarak yazdırır / PDF olarak kaydeder.

Tamamen istemci tarafında (client-side) çalışan, sunucu gerektirmeyen statik bir uygulamadır. Veriler
tarayıcının `localStorage`'ında saklanır.

## Ne Yapar

- **Eğitim Ayı** kavramını doğru şekilde uygular: 1 Eğitim Ayı = 4 AKTİF eğitim haftası (tatil haftaları sayılmaz).
- ROBOMOST'un 2026–2027 akademik takvimini varsayılan (seed) veri olarak içerir; yeni akademik yıllar,
  haftalar ve tatiller yönetim panelinden eklenip düzenlenebilir.
- İki kayıt modunu destekler:
  - **Yeni Program**: Öğrenci programın başından başlar, her eğitim ayı tam ücretlendirilir.
  - **Mevcut Gruba Dahil Et**: Öğrenci başlamış bir gruba sonradan katılır; ilk (kısmi) eğitim ayı,
    öğrencinin gerçekten katılacağı aktif ders haftası sayısına göre **prorate** edilir.
- Varsayılan ödeme kuralı: ödeme, ilgili eğitim ayı başlamadan önce tamamlanmalıdır. "Özel Ödeme Planı"
  ile sabit ayın günü veya tamamen manuel tarihler kullanılabilir.
- Oluşan ödeme planındaki her satır (tarih, tutar, açıklama, ders sayısı) personel tarafından manuel
  olarak düzenlenebilir; manuel değişiklikler "Manuel düzenlendi" etiketiyle işaretlenir ve yeniden
  hesaplama sırasında korunur.
- A4 belge önizleme + yazdırma: VELİ NÜSHASI ve ROBOMOST NÜSHASI, her ikisinde de imza/kaşe alanı.

## Nasıl Kullanılır

1. Pinokio üzerinden uygulamayı açın (veya `index.html` dosyasını tarayıcıda açın).
2. **Yeni Plan** sekmesinden veli/öğrenci bilgilerini, program bilgilerini, kayıt türünü (Yeni Program /
   Mevcut Gruba Dahil Et) ve ücret bilgilerini girin.
3. **Ödeme Planı Oluştur** butonuna basın. Otomatik hesaplanan taksit tablosunu gerektiğinde düzenleyin.
4. **Belge Önizleme** ile A4 çıktıyı kontrol edin, **PDF / Yazdır** ile yazdırın veya "Yazdır" olarak PDF kaydedin.
5. **Kayıtlı Planlar** sekmesinden mevcut planları görüntüleyebilir, düzenleyebilir, yazdırabilir,
   kopyalayabilir veya silebilirsiniz.
6. **Akademik Takvim** sekmesinden eğitim haftalarını/tatilleri düzenleyebilir veya yeni bir akademik yıl
   ekleyebilirsiniz — eğitim ayları bu veriden otomatik olarak yeniden hesaplanır.

## Geliştirme

Kaynak kod `app/` klasöründedir (Vite + React + TypeScript + Tailwind CSS). Proje kökündeki
`index.html` ve `assets/` klasörü, bu kaynağın derlenmiş (build) çıktısıdır — Pinokio bu dosyaları
doğrudan statik bir "serverless web app" olarak çalıştırır, ek bir kurulum/başlatma betiğine gerek yoktur.

Kaynak kodda değişiklik yaptıktan sonra yeniden derlemek için:

```bash
cd app
npm install
npm run build
```

`npm run build`, TypeScript derlemesini + Vite build'i çalıştırır ve çıktıyı otomatik olarak proje
köküne (`index.html`, `assets/`) kopyalar.

Hesaplama motoru testlerini çalıştırmak için:

```bash
cd app
npm run test
```

## Mimari

- `src/types/` — Akademik takvim ve öğrenci/ödeme veri modelleri.
- `src/services/calendarEngine.ts` — `calculateEducationPeriods`, `getStudentLessonDates`,
  `calculateProgramEndDate` gibi saf (pure) fonksiyonlar. Akademik takvimi "Eğitim Ayı" gruplarına ayırır.
- `src/services/paymentEngine.ts` — `calculatePaymentDueDates`, `generatePaymentPlan`,
  `mergeManualOverrides`. Tam/kısmi dönem ücretlendirmesini ve ödeme tarihlerini hesaplar.
- `src/services/__tests__/` — Vitest testleri (spesifikasyondaki örnek senaryo ve edge case'ler dahil).
- `src/components/` — `StudentForm`, `ProgramForm`, `EnrollmentForm`, `PaymentSettingsForm`,
  `PaymentPlanTable`, `AcademicYearEditor`, `GraphicCalendar`, `SignatureSection`, `PrintDocument`.
- `src/data/seedAcademicYear2026_2027.ts` — 2026–2027 ROBOMOST akademik takvimi (seed veri).

## Programatik Erişim (Hesaplama Motoru API'si)

Bu uygulama sunucusuz (client-only) bir araçtır; bir HTTP/REST sunucusu **yoktur**, dolayısıyla
cURL ile erişilebilecek bir uç nokta bulunmaz. Ancak hesaplama motoru bağımsız, saf TypeScript/JavaScript
fonksiyonlarından oluşur ve başka bir Node.js/TypeScript projesinden doğrudan import edilebilir.

### JavaScript / TypeScript

```ts
import { calculateEducationPeriods, getStudentLessonDates } from "./src/services/calendarEngine";
import { generatePaymentPlan } from "./src/services/paymentEngine";
import { ACADEMIC_YEAR_2026_2027 } from "./src/data/seedAcademicYear2026_2027";

const periods = calculateEducationPeriods(ACADEMIC_YEAR_2026_2027);

const plan = generatePaymentPlan({
  academicYear: ACADEMIC_YEAR_2026_2027,
  programDays: ["Cumartesi"],
  payment: {
    useCustomPaymentPlan: false,
    currency: "TRY",
    fullEducationMonthPrice: 6000,
    extraFees: []
  },
  enrollment: {
    mode: "existing-group",
    academicYearId: ACADEMIC_YEAR_2026_2027.id,
    groupStartDate: "2026-09-12",
    groupProgramLengthWeeks: 12,
    enrollmentDate: "2026-09-19",
    programEndRule: "with-group"
  }
});

console.log(plan.installments, plan.totals.grandTotal);
```

### Python (referans formül — bu depoda çalışan bir Python servisi yoktur)

ROBOMOST bu mantığı bir backend'e taşımak isterse, kısmi dönem ücretlendirme formülü şu şekildedir:

```python
def prorated_installment_amount(full_education_month_price: float, active_week_count: int) -> float:
    """1 Eğitim Ayı = 4 aktif eğitim haftası. Kısmi dönemler haftalık orana göre ücretlendirilir."""
    weekly_price = full_education_month_price / 4
    return round(weekly_price * active_week_count, 2)

# Örnek: 6.000 TL / 4 hafta * 3 aktif hafta = 4.500 TL
prorated_installment_amount(6000, 3)  # -> 4500.0
```

### cURL

Uygulamanın bir sunucu bileşeni olmadığından cURL ile çağrılabilecek bir API endpoint'i yoktur.
Tüm hesaplamalar tarayıcıda, istemci tarafında yapılır.
