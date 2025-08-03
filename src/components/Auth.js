import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!email || !password || (!isLogin && (!name || !surname))) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
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
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          name: name,
          surname: surname,
          rank: 'E',
          createdAt: new Date(),
          isFirstLogin: true
        });
        setSuccess('Hesap başarıyla oluşturuldu! Hoş geldiniz!');
      }
    } catch (error) {
      switch (error.code) {
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

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    clearMessages();
    setPassword('');
    setConfirmPassword('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Kullanıcının daha önce kayıt olup olmadığını kontrol et
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Yeni kullanıcı - Firestore'a kaydet
        const userData = {
          email: user.email,
          name: user.displayName?.split(' ')[0] || 'Kullanıcı',
          surname: user.displayName?.split(' ').slice(1).join(' ') || '',
          rank: 'E',
          createdAt: new Date(),
          isFirstLogin: true,
          authProvider: 'google',
          photoURL: user.photoURL
        };

        await setDoc(userDocRef, userData);
        setSuccess('Google ile hesap başarıyla oluşturuldu! Hoş geldiniz!');
      } else {
        setSuccess('Google ile giriş başarılı! Hoş geldiniz!');
      }

    } catch (error) {
      console.error('Google sign-in error:', error);
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Google giriş penceresi kapatıldı');
          break;
        case 'auth/popup-blocked':
          setError('Pop-up engellendi. Lütfen pop-up engelleyiciyi devre dışı bırakın');
          break;
        case 'auth/cancelled-popup-request':
          setError('Giriş işlemi iptal edildi');
          break;
        case 'auth/network-request-failed':
          setError('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin');
          break;
        case 'auth/too-many-requests':
          setError('Çok fazla deneme. Lütfen daha sonra tekrar deneyin');
          break;
        case 'auth/user-disabled':
          setError('Bu hesap devre dışı bırakılmıştır');
          break;
        default:
          setError('Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo">
          <span className="auth-logo-icon">🌟</span>
          <span className="auth-logo-text">Solo Habits</span>
        </div>
        <h2>{isLogin ? 'Hoş Geldiniz!' : 'Hesap Oluşturun'}</h2>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Alışkanlık yolculuğunuza devam edin' 
            : 'Kişisel gelişim yolculuğunuza başlayın'
          }
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
        {!isLogin && (
          <div className="auth-name-group">
            <div className="auth-input-group">
              <input
                type="text"
                placeholder="Adınız"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearMessages();
                }}
                disabled={isLoading}
                required
              />
            </div>
            <div className="auth-input-group">
              <input
                type="text"
                placeholder="Soyadınız"
                value={surname}
                onChange={(e) => {
                  setSurname(e.target.value);
                  clearMessages();
                }}
                disabled={isLoading}
                required
              />
            </div>
          </div>
        )}

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

        {!isLogin && (
          <div className="auth-input-group">
            <input
              type="password"
              placeholder="Şifre tekrarı"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearMessages();
              }}
              disabled={isLoading}
              required
            />
          </div>
        )}

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

      <div className="auth-divider">
        <span>veya</span>
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
            Google ile bağlanılıyor...
          </>
        ) : (
          <>
            <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Devam Et
          </>
        )}
      </button>

      <div className="auth-divider">
        <span>veya</span>
      </div>

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