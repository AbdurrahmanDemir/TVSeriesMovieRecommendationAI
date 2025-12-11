# 🔒 Güvenlik Uyarısı - API Key'leri

## ⚠️ ÖNEMLİ UYARI

Bu projede API key'ler **asla** kodun içine hardcoded olarak yazılmamalıdır!

## 🔐 Güvenli Kullanım

### 1. API Key'lerinizi Koruyun
- API key'lerinizi **asla** GitHub'a push etmeyin
- `.gitignore` dosyasının `.env` dosyasını içerdiğinden emin olun
- Public repository'lerde API key paylaşmayın

### 2. API Key Nasıl Eklenir

#### TMDb API Key
1. `utils/constants.js` dosyasını açın
2. `TMDB_API_KEY` değerini kendi key'inizle değiştirin:
```javascript
export const TMDB_API_KEY = 'buraya_kendi_tmdb_keyinizi_yazin';
```

#### Gemini API Key  
1. `api/gemini.js` dosyasını açın
2. `GEMINI_API_KEY` değerini kendi key'inizle değiştirin:
```javascript
const GEMINI_API_KEY = 'buraya_kendi_gemini_keyinizi_yazin';
```

### 3. Eğer Yanlışlıkla Push Ettiyseniz

1. **Hemen API key'leri iptal edin:**
   - TMDb: https://www.themoviedb.org/settings/api
   - Google AI Studio: https://makersuite.google.com/app/apikey

2. **Yeni key'ler oluşturun**

3. **Git history'den kaldırın:**
```bash
# BFG Repo-Cleaner kullanarak
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch utils/constants.js api/gemini.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

## 📚 Daha Fazla Bilgi

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
