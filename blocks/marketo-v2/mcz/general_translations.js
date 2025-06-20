/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// General Form Translations

export default async function init(mkfC) {
  mkfC.log('General Form Translations Added');

  const mcz_submit_verbs = ['submit', 'download', 'register', 'join'];
  const translateFormElems_temp = {
    submit: {
      en_us: 'Submit',
      en_gb: 'Submit',
      es_es: 'Enviar',
      fr_fr: 'Valider',
      ja_jp: '送信',
      zh_tw: '提交',
      zh_cn: '提交',
      ko: '제출',
      de: 'Einreichen',
      da: 'Indsend',
      sv: 'Skicka',
      it: 'Invia',
      nl: 'Verzenden',
      no: 'Send inn',
      pt: 'Enviar',
      fi: 'Lähetä',
      ru: 'Отправить',
      tr: 'Gönder',
      pl: 'Zatwierdź',
      cs: 'Odeslat',
    },
    state: {
      en_us: 'State/province',
      es_es: 'Provincia',
      de: 'Bundesland',
      fr_fr: 'Région',
      zh_cn: '省/直辖市/自治区',
      ja_jp: '都道府県',
      ko: '시/도',
      zh_tw: '縣或市',
      da: 'Stat eller provins',
      sv: 'Stat eller provins',
      it: 'Provincia',
      en_gb: 'State/province',
      nl: 'Provincie',
      no: 'Delstat eller område',
      pt: 'Estado/Província',
      fi: 'Alue tai paikkakunta',
      ru: 'Область',
      tr: 'Eyalet/İl',
      pl: 'Województwo',
      cs: 'Stát/oblast',
    },
    next: {
      en_us: 'Next',
      en_gb: 'Next',
      es_es: 'Siguiente',
      fr_fr: 'Suivant',
      ja_jp: '次へ',
      zh: '下一个',
      ko: '다음',
      de: 'Nächster',
      da: 'Næste',
      sv: 'Nästa',
      it: 'Prossimo',
      nl: 'Volgende',
      no: 'Neste',
      pt: 'Próximo',
      fi: 'Seuraava',
      ru: 'Далее',
      tr: 'Sonraki',
      pl: 'Następny',
      cs: 'Další',
    },
    thankyou: {
      en_us: 'Thank you for your submission.',
      en_gb: 'Thank you for your submission.',
      es_es: 'Gracias por tu envío.',
      fr_fr: 'Merci pour votre soumission.',
      ja_jp: 'ご提出いただきありがとうございます。',
      zh: '感谢您的提交。',
      ko: '제출해 주셔서 감사합니다.',
      de: 'Vielen Dank für Ihre Einreichung.',
      da: 'Tak for din indsendelse.',
      sv: 'Tack för din inlämning.',
      it: 'Grazie per il tuo invio.',
      nl: 'Bedankt voor uw inzending.',
      no: 'Takk for innsendingen din.',
      pt: 'Obrigado pela sua submissão.',
      fi: 'Kiitos lähetyksestäsi.',
      ru: 'Спасибо за вашу заявку.',
      tr: 'Gönderiniz için teşekkür ederiz.',
      pl: 'Dziękujemy za przesłanie.',
      cs: 'Děkujeme za vaše příspěvky.',
    },
    pleasewait: {
      en_us: 'Please Wait',
      en_gb: 'Please Wait',
      es_es: 'Por favor espera',
      fr_fr: 'Veuillez patienter',
      ja_jp: 'お待ちください',
      zh: '请稍等',
      ko: '기다려 주십시오',
      de: 'Bitte warten',
      da: 'Vent venligst',
      sv: 'Vänta',
      it: 'Attendere prego',
      nl: 'Even geduld aub',
      no: 'Vennligst vent',
      pt: 'Por favor, aguarde',
      fi: 'Odota hetki',
      ru: 'Пожалуйста, подождите',
      tr: 'Lütfen bekleyin',
      pl: 'Proszę czekać',
      cs: 'Prosím počkejte',
    },
    lang: {
      en_us: 'en_us',
      en_gb: 'en_gb',
      es_es: 'es_es',
      fr_fr: 'fr_fr',
      ja_jp: 'ja',
      zh: 'zh',
      ko: 'ko',
      de: 'de',
      da: 'da',
      sv: 'sv',
      it: 'it',
      nl: 'nl',
      no: 'no',
      pt: 'pt',
      fi: 'fi',
      ru: 'ru',
      tr: 'tr',
      pl: 'pl',
      cs: 'cs',
    },
    welcomeback: {
      en_us: 'Welcome back',
      en_gb: 'Welcome back',
      es_es: 'Bienvenido de nuevo',
      fr_fr: 'Bienvenue de retour',
      ja_jp: 'おかえりなさい',
      zh_tw: '歡迎回來',
      ko: '다시 오신 것을 환영합니다',
      de: 'Willkommen zurück',
      da: 'Velkommen tilbage',
      sv: 'Välkommen tillbaka',
      it: 'Bentornato',
      nl: 'Welkom terug',
      no: 'Velkommen tilbake',
      pt: 'Bem-vindo de volta',
      fi: 'Tervetuloa takaisin',
      ru: 'Добро пожаловать обратно',
      tr: 'Tekrar hoşgeldiniz',
      pl: 'Witamy z powrotem',
      cs: 'Vítejte zpět',
    },
    notyou: {
      en_us: 'Not you?',
      en_gb: 'Not you?',
      es_es: '¿No eres tú?',
      fr_fr: 'Pas vous?',
      ja_jp: 'あなたではない？',
      zh_tw: '不是你？',
      ko: '당신이 아니신가요?',
      de: 'Nicht du?',
      da: 'Ikke dig?',
      sv: 'Inte du?',
      it: 'Non sei tu?',
      nl: 'Ben jij het niet?',
      no: 'Ikke deg?',
      pt: 'Não é você?',
      fi: 'Eikö sinä?',
      ru: 'Не ты?',
      tr: 'Siz değil misiniz?',
      pl: 'Nie ty?',
      cs: 'Nejste to vy?',
    },
    download: {
      en_us: 'Download',
      en_gb: 'Download',
      es_es: 'Descargar',
      fr_fr: 'Télécharger',
      ja_jp: 'ダウンロード',
      zh: '下载',
      ko: '다운로드',
      de: 'Herunterladen',
      da: 'Hent',
      sv: 'Ladda ner',
      it: 'Scarica',
      nl: 'Downloaden',
      no: 'Last ned',
      pt: 'Baixar',
      fi: 'Lataa',
      ru: 'Скачать',
      tr: 'İndir',
      pl: 'Pobieranie',
      cs: 'Stáhnout',
    },
    register: {
      en_us: 'Register',
      en_gb: 'Register',
      es_es: 'Registrarse',
      fr_fr: "S'inscrire",
      ja_jp: '登録',
      zh: '注册',
      ko: '등록',
      de: 'Registrieren',
      da: 'Registrer',
      sv: 'Registrera',
      it: 'Registrati',
      nl: 'Registreren',
      no: 'Registrer',
      pt: 'Registrar',
      fi: 'Rekisteröidy',
      ru: 'Зарегистрироваться',
      tr: 'Kayıt ol',
      pl: 'Zarejestruj się',
      cs: 'Zaregistrovat',
    },
    join: {
      en_us: 'Join Now',
      en_gb: 'Join Now',
      es_es: 'Únete ahora',
      fr_fr: 'Rejoignez maintenant',
      ja: '今すぐ参加',
      zh: '立即加入',
      ko: '지금 가입하세요',
      de: 'Jetzt beitreten',
      da: 'Tilmeld dig nu',
      sv: 'Gå med nu',
      it: 'Iscriviti ora',
      nl: 'Nu lid worden',
      no: 'Bli med nå',
      pt: 'Junte-se agora',
      fi: 'Liity nyt',
      ru: 'Присоединиться сейчас',
      tr: 'Şimdi katılın',
      pl: 'Dołącz teraz',
      cs: 'Připojte se nyní',
    },
  };
  if (typeof window.translateFormElems === 'undefined') {
    mkfC.log('General Form Translations not found, adding values');
    window.translateFormElems = translateFormElems_temp;
  } else {
    mkfC.log('General Form Translations found, checking for missing values');
    for (const key in translateFormElems_temp) {
      if (translateFormElems_temp.hasOwnProperty(key)) {
        mkfC.log(
          `Translation '${key}' not found, adding '${translateFormElems_temp[key]}'`,
        );
        translateFormElems[key] = translateFormElems_temp[key];
      }
    }
  }

  // Do we have a global override for the submit button text?
  let override_submit = window.mcz_marketoForm_pref?.form?.cta?.override;
  if (typeof override_submit !== 'undefined' && override_submit !== null) {
    if (override_submit.trim() !== '') {
      // make sure it's a string and no over 45 characters
      if (typeof override_submit !== 'string' || override_submit.length > 45) {
        mkfC.log(
          `Override submit with "${override_submit}" is not a string or is over 45 characters, skipping`,
        );
      } else {
        override_submit = override_submit.charAt(0).toUpperCase() + override_submit.slice(1);
        mkfC.log(`Overriding submit with "${override_submit}"`);

        for (const verb of mcz_submit_verbs) {
          mkfC.log(`Overriding "${verb}" with "${override_submit}"`);
          try {
            for (const lang in translateFormElems[verb]) {
              translateFormElems[verb][lang] = override_submit;
            }
          } catch (e) {
            mkfC.log(`Error overriding "${verb}" with "${override_submit}": ${e}`);
          }
        }
      }
    }
  }
}
