# Metin Boss Takip
Gönderdiğin ekran görüntüsüne göre hazırlanmış React + Vite + Supabase projesi.

## Özellikler
- CH1–CH6 aynı ekranda ve bağımsız sayaçlar
- 60 dakikalık döngü; süre dolunca onaysız otomatik yeni döngü
- Son 5 dakika sarı, son 3 dakika kırmızı
- Son 3 dakikada ses ve izin verilirse tarayıcı bildirimi
- 60dk Reset ve Saat Düzenle
- Yönetici tarafından oluşturulan kullanıcı adı/şifre hesapları
- Yönetici üye oluşturma, şifre değiştirme, silme
- Supabase Realtime ortak sayaç güncellemeleri

## Supabase bağlantısı
`.env.example` dosyasını `.env` olarak kopyala. `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini Supabase Project Settings > API bölümünden doldur. Publishable key veya legacy anon key kullanılabilir. **service_role/secret key tarayıcıya konulmaz.**

## Veritabanı
İlk SQL kurulumu zaten çalıştırıldıysa `supabase/schema.sql` yalnızca eksik kolon/policy/Realtime ayarlarını tamamlar; var olan kanal satırlarını silmez.

## İlk yönetici hesabı
1. Supabase > Authentication > Users > Add user ile `admin@boss.local` e-postalı kullanıcı oluştur.
2. Kullanıcı listesinden UUID'yi kopyala.
3. SQL Editor'de aşağıdaki sorguda UUID'yi değiştirip çalıştır:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"username":"admin"}'::jsonb
where id = 'ADMIN_USER_UUID';
```

Uygulama girişinde kullanıcı adı `admin` ve belirlediğin şifreyi kullan.

## Yönetici fonksiyonu
`supabase/functions/admin-users/index.ts` dosyasını Supabase Edge Functions'a `admin-users` adıyla deploy et. Fonksiyon Supabase'in sunucu ortamındaki `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` değerlerini kullanır. Service role key'i istemciye asla koyma.

## Yayınlama
Proje GitHub'a yüklenip Vercel'e bağlanınca Vercel Project Settings > Environment Variables bölümüne aynı iki `VITE_` değerini ekle ve redeploy yap. Bu ZIP henüz internette yayınlanmış canlı site değildir; Supabase anahtarları ve hosting bağlantısı girilmelidir.
