import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Geçerli bir email adresi girin');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Giriş başarılı! Hoş geldiniz!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Firestore'da kullanıcı dokümanı oluştur
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: new Date().toISOString(),
          displayName: user.email.split('@')[0]
        });
        
        setSuccess('Hesap başarıyla oluşturuldu! Hoş geldiniz!');
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-credential':
          setError('Email veya şifre yanlış. Lütfen kontrol edin.');
          break;
        case 'auth/user-not-found':
          setError('Bu email adresine kayıtlı kullanıcı bulunamadı');
          break;
        case 'auth/wrong-password':
          setError('Hatalı şifre girdiniz');
          break;
        case 'auth/email-already-in-use':
          setError('Bu email adresi zaten kullanımda');
          break;
        case 'auth/weak-password':
          setError('Şifre çok zayıf. Daha güçlü bir şifre seçin');
          break;
        case 'auth/invalid-email':
          setError('Geçersiz email adresi');
          break;
        case 'auth/too-many-requests':
          setError('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin');
          break;
        default:
          setError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Kullanıcı Firestore'da var mı kontrol et
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Firestore'da kullanıcı profili oluştur
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'google'
        });
      }
      
      setSuccess('Google ile giriş başarılı! Hoş geldiniz!');
    } catch (error) {
      console.error('Google giriş hatası:', error);
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Giriş penceresi kapatıldı. Lütfen tekrar deneyin.');
          break;
        case 'auth/popup-blocked':
          setError('Pop-up engellendi. Lütfen tarayıcı ayarlarını kontrol edin.');
          break;
        case 'auth/cancelled-popup-request':
          setError('Giriş işlemi iptal edildi.');
          break;
        default:
          setError('Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    clearMessages();
    setPassword('');
  };

  // Google/Signup akışları kaldırıldı – arayüz sade

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo">
          <span className="auth-logo-icon">🌟</span>
          <span className="auth-logo-text">Solo Habits</span>
        </div>
        <h2>{isLogin ? 'Hoş Geldiniz!' : 'Hesap Oluşturun'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Alışkanlık yolculuğunuza devam edin' : 'Yeni alışkanlık yolculuğunuza başlayın'}
        </p>
      </div>

      {error && (
        <div className="auth-message error">
          <span className="auth-message-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="auth-message success">
          <span className="auth-message-icon">✅</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Kayıt alanları kaldırıldı */}

        <div className="auth-input-group">
          <input
            type="email"
            placeholder="Email adresiniz"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearMessages();
            }}
            disabled={isLoading}
            required
          />
        </div>

        <div className="auth-input-group">
          <input
            type="password"
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearMessages();
            }}
            disabled={isLoading}
            required
          />
        </div>

        {/* Şifre tekrarı kaldırıldı */}

        <button 
          type="submit" 
          className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="auth-loading-spinner"></span>
              {isLogin ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...'}
            </>
          ) : (
            <>
              <span className="auth-btn-icon">
                {isLogin ? '🔑' : '🚀'}
              </span>
              {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
            </>
          )}
        </button>
      </form>

      {/* Google Login */}
      <div className="auth-divider">
        <span className="auth-divider-text">veya</span>
      </div>

      <button 
        type="button" 
        className="auth-google-btn"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="auth-loading-spinner"></span>
            Google ile giriş yapılıyor...
          </>
        ) : (
          <>
            <span className="auth-google-icon">G</span>
            Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </>
        )}
      </button>

      <div className="auth-switch">
        <p>
          {isLogin ? 'Henüz hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
        </p>
        <button 
          type="button" 
          className="auth-switch-btn" 
          onClick={handleModeSwitch}
          disabled={isLoading}
        >
          {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </div>

      <div className="auth-footer">
        <p>Solo Habits ile alışkanlıklarınızı takip edin ve hedefinize ulaşın! 🎯</p>
      </div>
    </div>
  );
}

export default Auth;