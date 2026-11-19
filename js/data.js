// PERMAS NASIONAL DATA STORE
// Persatuan Mahasiswa Selangor Kebangsaan

const PERMAS_DATA = {
  stats: {
    totalMembers: "28,450+",
    campuses: "38",
    aidDisbursed: "RM 3.8M",
    activePrograms: "140+",
    yearFounded: "1974"
  },

  slogan: "PERMAS Proaktif, Selangor Progresif",
  campaign: "KITA SISWA SELANGOR",
  nilaiTeras: [
    {
      huruf: "K",
      nama: "KEPIMPINAN",
      huraian: "Membentuk barisan pemimpin mahasiswa yang berwibawa, berintegriti dan mampu menjadi agen perubahan dalam komuniti."
    },
    {
      huruf: "I",
      nama: "INOVASI",
      huraian: "Menggalakkan budaya pemikiran kreatif dan inovatif dalam kalangan mahasiswa Selangor bagi melahirkan idea, pendekatan dan inisiatif relevan cabaran masa hadapan."
    },
    {
      huruf: "T",
      nama: "TRANSFORMASI",
      huraian: "Membawa pembaharuan yang relevan dan berimpak dalam memperkukuh peranan PERMAS Nasional sebagai organisasi mahasiswa profesional di peringkat nasional."
    },
    {
      huruf: "A",
      nama: "ASPIRASI",
      huraian: "Menjadikan PERMAS Nasional sebagai platform yang mendengar, membawa dan merealisasikan suara serta keperluan mahasiswa Selangor."
    }
  ],

  leadership: [
    // MAJLIS TERTINGGI
    {
      id: "presiden",
      name: "Ahmad Amirul Irfan bin Ahmad Saupi",
      position: "Presiden",
      institution: "Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA)",
      shortUni: "UMPSA",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "PRESIDEN",
      photo: "assets/ahli/presiden.jpg",
      featured: true,
      quote: "Menerajui gerak kerja organisasi dalam memperkukuh peranan mahasiswa Selangor di peringkat nasional berteraskan slogan PERMAS Proaktif, Selangor Progresif.",
      social: { instagram: "permasnasionalofficial", email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "tydp1",
      name: "Muhammad Danish Hariz bin Hamdan",
      position: "Timbalan Presiden I",
      institution: "Universiti Kebangsaan Malaysia (UKM)",
      shortUni: "UKM",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "TP I",
      photo: "assets/ahli/tydp1.jpg",
      quote: "Memperkukuh kepimpinan cawangan kampus dan memacu agenda sinergi antara universiti awam seluruh Malaysia.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "tydp2",
      name: "Tharshanraj Pillay A/L T.Wandek Silvam",
      position: "Timbalan Presiden II",
      institution: "Universiti Malaya (UM)",
      shortUni: "UM",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "TP II",
      photo: "assets/ahli/tydp2.jpg",
      quote: "Menjamin keterangkuman dan representasi berbilang kaum mahasiswa anak Selangor dalam arus pembangunan negeri.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "suag",
      name: "Noor Hayati binti Adullah",
      position: "Setiausaha Agung",
      institution: "Universiti Utara Malaysia (UUM)",
      shortUni: "UUM",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "SUAG",
      photo: "assets/ahli/suag.jpg",
      quote: "Tadbir urus perlembagaan telus, pengurusan dokumentasi rasmi serta keselarasan tatakelola seluruh jentera PERMAS.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "bendahari",
      name: "Faris Imran bin Sofan",
      position: "Bendahari Kehormat",
      institution: "Universiti Sains Islam Malaysia (USIM)",
      shortUni: "USIM",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "BENDAHARI",
      photo: "assets/ahli/bendahari.jpg",
      quote: "Amanah kewangan berintegriti, pengagihan dana efisien dan pengurusan peruntukan berimpak tinggi.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "penerangan",
      name: "Muhammad Harith Darwish bin Nor Mali",
      position: "Ketua Penerangan",
      institution: "Universiti Sultan Zainal Abidin (UniSZA)",
      shortUni: "UniSZA",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "PENERANGAN",
      photo: "assets/ahli/penerangan.jpg",
      quote: "Menyampaikan wacana dasar negeri dan ketelusan maklumat kepada seluruh komuniti mahasiswa anak Selangor.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "su-komunikasi",
      name: "Nur Emylieya Natasyha binti Ad Noor",
      position: "Setiausaha Seksyen Komunikasi & Korporat",
      institution: "Universiti Malaysia Terengganu (UMT)",
      shortUni: "UMT",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "SU KORPORAT",
      photo: "assets/ahli/su-komunikasi.jpg",
      quote: "Membangunkan jaringan strategik korporat serta memperkasa jenama digital PERMAS Nasional di persada media.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "su-pembangunan",
      name: "Arif Khumaini bin Muhamad Fairuz",
      position: "Setiausaha Seksyen Pembangunan & Pemerkasaan Mahasiswa",
      institution: "Universiti Pendidikan Sultan Idris (UPSI)",
      shortUni: "UPSI",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "SU PEMBANGUNAN",
      photo: "assets/ahli/su-pembangunan.jpg",
      featuredBadge: "Pimpinan Mahasiswa",
      quote: "Merapatkan ekosistem bakat mahasiswa dengan kemahiran masa hadapan, pendidikan holistik dan kebolehpasaran graduan berdaya saing.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "su-kebajikan",
      name: "Nurul Najiha binti Mohd Fairulzaman",
      position: "Setiausaha Seksyen Kebajikan Mahasiswa",
      institution: "Universiti Islam Antarabangsa Malaysia (UIAM)",
      shortUni: "UIAM",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "SU KEBAJIKAN",
      photo: "assets/ahli/su-kebajikan.jpg",
      quote: "Menjaga kebajikan asasi mahasiswa, gerak kerja bantuan kecemasan dan memastikan tiada anak Selangor terpinggir.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "timbalan-bendahari",
      name: "Nur Nazirah Fatehah binti Mohamed Nazri",
      position: "Timbalan Bendahari",
      institution: "Universiti Malaysia Perlis (UniMAP)",
      shortUni: "UniMAP",
      section: "tertinggi",
      badge: "Majlis Tertinggi",
      roleCode: "TIMB. BENDAHARI",
      photo: "assets/ahli/timbalan-bendahari.jpg",
      quote: "Memantau audit berkala, tatatertib akaun dan ketelusan sumber kewangan persatuan.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },

    // MAJLIS EKSEKUTIF - SEKSYEN PEMBANGUNAN & PEMERKASAAN MAHASISWA
    {
      id: "exco-akademik",
      name: "Aiman Shahmi Azuttdin",
      position: "Exco Akademik dan Kerjaya Mahasiswa",
      institution: "Universiti Malaysia Sabah (UMS)",
      shortUni: "UMS",
      section: "pembangunan",
      badge: "Seksyen Pembangunan",
      roleCode: "EXCO AKADEMIK",
      quote: "Meningkatkan kecemerlangan akademik dan mempermudah laluan kerjaya pasca-ijazah mahasiswa Selangor.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-sukan",
      name: "Muhammad Amir Afiq bin Mohd Badran",
      position: "Exco Sukan dan Kebudayaan",
      institution: "Universiti Teknikal Malaysia Melaka (UTeM)",
      shortUni: "UTeM",
      section: "pembangunan",
      badge: "Seksyen Pembangunan",
      roleCode: "EXCO SUKAN",
      quote: "Menyuburkan nilai kesukanan, kecergasan dan warisan seni budaya tradisi Negeri Selangor di kampus.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-keusahawanan",
      name: "Muhammad Ammar Haqeem bin Nordin",
      position: "Exco Keusahawanan, Ekonomi dan Inovasi",
      institution: "Universiti Sains Malaysia (USM)",
      shortUni: "USM",
      section: "pembangunan",
      badge: "Seksyen Pembangunan",
      roleCode: "EXCO INOVASI",
      quote: "Melahirkan usahawan tekno-siswazah berpendapatan tinggi yang merintis industri baharu.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-sukarelawan",
      name: "Muhammad Irfan Naufal bin Mohd Hazri",
      position: "Exco Sukarelawan, Khidmat Komuniti dan Kelestarian",
      institution: "Universiti Malaysia Kelantan (UMK)",
      shortUni: "UMK",
      section: "pembangunan",
      badge: "Seksyen Pembangunan",
      roleCode: "EXCO RELAWAN",
      quote: "Menggembleng tenaga belia Selangor dalam inisiatif kelestarian alam dan bakti kemasyarakatan.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },

    // MAJLIS EKSEKUTIF - SEKSYEN KEBAJIKAN MAHASISWA
    {
      id: "exco-kebajikan-kerohanian",
      name: "Farah Wahidah binti Abdul Rahman",
      position: "Exco Kebajikan, Kerohanian dan Perpaduan",
      institution: "Universiti Utara Malaysia (UUM)",
      shortUni: "UUM",
      section: "kebajikan",
      badge: "Seksyen Kebajikan",
      roleCode: "EXCO KEBAJIKAN",
      quote: "Membina daya tahan emosi, pemantapan rohani serta keharmonian perpaduan mahasiswa kampus.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-inklusiviti-1",
      name: "Dinie Dasuki bin Abdul Rasid",
      position: "Exco Inklusiviti & Integrasi Hubungan Wilayah",
      institution: "Universiti Islam Antarabangsa Malaysia (UIAM)",
      shortUni: "UIAM",
      section: "kebajikan",
      badge: "Seksyen Kebajikan",
      roleCode: "EXCO INTEGRASI",
      quote: "Mempererat persefahaman dan interaksi antara cawangan mahasiswa di seluruh semenanjung dan kepulauan Borneo.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-inklusiviti-2",
      name: "Dikosongkan Untuk Lantikan Institusi",
      position: "Exco Inklusiviti & Integrasi Hubungan Wilayah",
      institution: "Universiti Tun Hussein Onn Malaysia (UTHM)",
      shortUni: "UTHM",
      section: "kebajikan",
      badge: "Seksyen Kebajikan",
      roleCode: "LANTIKAN KHAS",
      quote: "Kerusi khas perwakilan kampus zon selatan bagi pemerkasaan sinergi IPT.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-siswi",
      name: "Nur Adriana Najwa binti Noradha",
      position: "Exco Pemerkasaan dan Hal Ehwal Siswi",
      institution: "Universiti Putra Malaysia (UPM)",
      shortUni: "UPM",
      section: "kebajikan",
      badge: "Seksyen Kebajikan",
      roleCode: "EXCO SISWI",
      quote: "Memartabatkan kepimpinan mahasiswi wanita Selangor dalam pembuat keputusan dan advokasi keselamatan.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },

    // MAJLIS EKSEKUTIF - SEKSYEN KOMUNIKASI & KORPORAT
    {
      id: "exco-multimedia-1",
      name: "Razdaniel bin Reezal",
      position: "Exco Multimedia dan Publisiti",
      institution: "Universiti Kebangsaan Malaysia (UKM)",
      shortUni: "UKM",
      section: "komunikasi",
      badge: "Seksyen Komunikasi",
      roleCode: "EXCO MEDIA",
      quote: "Kreativiti visual bertenaga bagi membina impak naratif anak Selangor yang berdaya saing.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-multimedia-2",
      name: "Muhammad Adib Ubaidullah bin Azman",
      position: "Exco Multimedia dan Publisiti",
      institution: "Universiti Pertahanan Nasional Malaysia (UPNM)",
      shortUni: "UPNM",
      section: "komunikasi",
      badge: "Seksyen Komunikasi",
      roleCode: "EXCO MEDIA",
      quote: "Penyebaran hebahan pantas, rekabentuk berkualiti tinggi dan sinergi media massa digital.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-multimedia-3",
      name: "Ahmad Khairul Amirin bin Adnan",
      position: "Exco Multimedia dan Publisiti",
      institution: "Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA)",
      shortUni: "UMPSA",
      section: "komunikasi",
      badge: "Seksyen Komunikasi",
      roleCode: "EXCO MEDIA",
      quote: "Pengukuhan saluran multimedia dan penerbitan berkala aspirasi mahasiswa Selangor.",
      social: { email: "permasnasionalofficial@gmail.com" }
    },
    {
      id: "exco-korporat-luar",
      name: "Muhamad Amirul Irfan bin Amir Hamzah",
      position: "Exco Komunikasi Korporat & Hubungan Luar",
      institution: "Universiti Sultan Zainal Abidin (UniSZA)",
      shortUni: "UniSZA",
      section: "komunikasi",
      badge: "Seksyen Komunikasi",
      roleCode: "EXCO KORPORAT",
      quote: "Membina jambatan kolaborasi bersama agensi kerajaan negeri, GLC Selangor dan pemegang taruh strategik.",
      social: { email: "permasnasionalofficial@gmail.com" }
    }
  ],

  campusBranches: [
    // 1. ZON TENGAH (SELANGOR & KL)
    {
      id: "um",
      code: "PERMAS UM",
      name: "Persatuan Mahasiswa Selangor Universiti Malaya",
      university: "Universiti Malaya",
      shortUni: "UM",
      type: "UA",
      zone: "Zon Tengah",
      state: "WP Kuala Lumpur",
      location: "Lembah Pantai, Kuala Lumpur",
      lat: 3.1209,
      lng: 101.6538,
      membersCount: 2850,
      president: "Luqman Hakim bin Rosli",
      contact: "+60 11-234 5678",
      instagram: "@permas_um",
      established: "1978",
      status: "Aktif Cemerlang",
      tagline: "Memimpin Dari Lembah Pantai Demi Selangor"
    },
    {
      id: "ukm",
      code: "PERMAS UKM",
      name: "Persatuan Mahasiswa Selangor UKM Bangi",
      university: "Universiti Kebangsaan Malaysia",
      shortUni: "UKM",
      type: "UA",
      zone: "Zon Tengah",
      state: "Selangor",
      location: "Bandar Baru Bangi, Selangor",
      lat: 2.9289,
      lng: 101.7801,
      membersCount: 3420,
      president: "Azim Farhan bin Mohd Yusof",
      contact: "+60 12-345 6789",
      instagram: "@permas_ukm",
      established: "1974",
      status: "Aktif Cemerlang",
      tagline: "Wadah Keramat Mahasiswa Selangor di UKM"
    },
    {
      id: "upm",
      code: "PERMAS UPM",
      name: "Persatuan Mahasiswa Selangor UPM Serdang",
      university: "Universiti Putra Malaysia",
      shortUni: "UPM",
      type: "UA",
      zone: "Zon Tengah",
      state: "Selangor",
      location: "Serdang, Selangor",
      lat: 2.9999,
      lng: 101.7081,
      membersCount: 3150,
      president: "Imran Syafiq bin Zulkifli",
      contact: "+60 13-987 6543",
      instagram: "@permas_upm",
      established: "1982",
      status: "Aktif Cemerlang",
      tagline: "Berilmu Berbakti Mahasiswa Selangor"
    },
    {
      id: "uitm",
      code: "PERMAS UiTM",
      name: "Gabungan Mahasiswa Selangor UiTM Se-Malaysia",
      university: "Universiti Teknologi MARA",
      shortUni: "UiTM",
      type: "UA",
      zone: "Zon Tengah",
      state: "Selangor",
      location: "Shah Alam, Selangor (Kampus Induk & Cawangan)",
      lat: 3.0698,
      lng: 101.4998,
      membersCount: 7200,
      president: "Hazim Zakaria bin Hisham",
      contact: "+60 19-876 5432",
      instagram: "@permasuitm_official",
      established: "1985",
      status: "Aktif Cemerlang",
      tagline: "Rangkaian Mahasiswa Terbesar Negeri Selangor"
    },
    {
      id: "uia",
      code: "PERMAS UIAM",
      name: "Selangor Student Association IIUM Gombak",
      university: "Universiti Islam Antarabangsa Malaysia",
      shortUni: "UIAM",
      type: "UA",
      zone: "Zon Tengah",
      state: "Selangor",
      location: "Gombak, Selangor",
      lat: 3.2535,
      lng: 101.7345,
      membersCount: 2400,
      president: "Zarif Ridzwan bin Razali",
      contact: "+60 16-789 0123",
      instagram: "@permas_iium",
      established: "1990",
      status: "Aktif",
      tagline: "Kearifan Intelek & Kepimpinan Holistik"
    },
    {
      id: "upnm",
      code: "PERMAS UPNM",
      name: "Sekretariat Mahasiswa Selangor UPNM",
      university: "Universiti Pertahanan Nasional Malaysia",
      shortUni: "UPNM",
      type: "UA",
      zone: "Zon Tengah",
      state: "WP Kuala Lumpur",
      location: "Kem Perdana Sungai Besi, KL",
      lat: 3.0558,
      lng: 101.7250,
      membersCount: 850,
      president: "Muhammad Hafizuddin bin Fauzi",
      contact: "+60 13-445 6677",
      instagram: "@permas_upnm",
      established: "2010",
      status: "Aktif",
      tagline: "Integriti, Disiplin & Bakti Pertiwi"
    },

    // 2. ZON SELATAN (NEGERI SEMBILAN, MELAKA, JOHOR)
    {
      id: "usim",
      code: "PERMAS USIM",
      name: "Persatuan Mahasiswa Selangor USIM Nilai",
      university: "Universiti Sains Islam Malaysia",
      shortUni: "USIM",
      type: "UA",
      zone: "Zon Selatan",
      state: "Negeri Sembilan",
      location: "Bandar Baru Nilai, Negeri Sembilan",
      lat: 2.8126,
      lng: 101.7811,
      membersCount: 1950,
      president: "Ahmad Muiz bin Salleh",
      contact: "+60 12-778 8990",
      instagram: "@permas_usim",
      established: "2002",
      status: "Aktif Cemerlang",
      tagline: "Integrasi Ilmu Naqli & Aqli"
    },
    {
      id: "utem",
      code: "PERMAS UTeM",
      name: "Persatuan Mahasiswa Selangor UTeM Melaka",
      university: "Universiti Teknikal Malaysia Melaka",
      shortUni: "UTeM",
      type: "UA",
      zone: "Zon Selatan",
      state: "Melaka",
      location: "Durian Tunggal, Melaka",
      lat: 2.3138,
      lng: 102.3188,
      membersCount: 1480,
      president: "Syakir Aiman bin Nazri",
      contact: "+60 17-334 5566",
      instagram: "@permas_utem",
      established: "2004",
      status: "Aktif",
      tagline: "Kemahiran Teknikal Pemacu Selangor Maju"
    },
    {
      id: "uthm",
      code: "PERMAS UTHM",
      name: "Persatuan Mahasiswa Selangor UTHM Batu Pahat",
      university: "Universiti Tun Hussein Onn Malaysia",
      shortUni: "UTHM",
      type: "UA",
      zone: "Zon Selatan",
      state: "Johor",
      location: "Parit Raja, Batu Pahat, Johor",
      lat: 1.8596,
      lng: 103.0858,
      membersCount: 1820,
      president: "Fikri Danial bin Kamaruzaman",
      contact: "+60 19-223 3445",
      instagram: "@permas_uthm",
      established: "2001",
      status: "Aktif",
      tagline: "Kejuruteraan & Kepimpinan Berimpak Tinggi"
    },
    {
      id: "utm",
      code: "PERMAS UTM",
      name: "Persatuan Mahasiswa Selangor UTM Skudai & KL",
      university: "Universiti Teknologi Malaysia",
      shortUni: "UTM",
      type: "UA",
      zone: "Zon Selatan",
      state: "Johor",
      location: "Skudai, Johor Bahru",
      lat: 1.5587,
      lng: 103.6378,
      membersCount: 2100,
      president: "Syahril Nizam bin Wahid",
      contact: "+60 17-654 3210",
      instagram: "@permas_utm",
      established: "1988",
      status: "Aktif Cemerlang",
      tagline: "Teknologi Untuk Kemajuan Selangor"
    },

    // 3. ZON UTARA (PERAK, PULAU PINANG, KEDAH, PERLIS)
    {
      id: "upsi",
      code: "PERMAS UPSI",
      name: "Persatuan Mahasiswa Selangor UPSI Tanjung Malim",
      university: "Universiti Pendidikan Sultan Idris",
      shortUni: "UPSI",
      type: "UA",
      zone: "Zon Utara",
      state: "Perak",
      location: "Tanjung Malim, Perak",
      lat: 3.6842,
      lng: 101.5244,
      membersCount: 2650,
      president: "Arif Khumaini bin Fairuz",
      contact: "+60 11-556 7788",
      instagram: "@permas_upsi",
      established: "1998",
      status: "Aktif Cemerlang",
      tagline: "Peneraju Pendidikan & Sahsiah Gemilang"
    },
    {
      id: "usm",
      code: "PERMAS USM",
      name: "Persatuan Mahasiswa Selangor USM Pulau Pinang",
      university: "Universiti Sains Malaysia",
      shortUni: "USM",
      type: "UA",
      zone: "Zon Utara",
      state: "Pulau Pinang",
      location: "Gelugor & Nibong Tebal, Pulau Pinang",
      lat: 5.3563,
      lng: 100.3015,
      membersCount: 1920,
      president: "Faiz Zuhairi bin Mahzan",
      contact: "+60 14-567 8901",
      instagram: "@permas_usm",
      established: "1986",
      status: "Aktif",
      tagline: "Gagasan Mahasiswa Selangor Di Perantauan Utara"
    },
    {
      id: "uum",
      code: "PERMAS UUM",
      name: "Persatuan Mahasiswa Selangor UUM Sintok",
      university: "Universiti Utara Malaysia",
      shortUni: "UUM",
      type: "UA",
      zone: "Zon Utara",
      state: "Kedah",
      location: "Sintok, Kedah Darul Aman",
      lat: 6.4604,
      lng: 100.5057,
      membersCount: 1750,
      president: "Haziq Iskandar bin Shahrul",
      contact: "+60 18-332 4455",
      instagram: "@permas_uum",
      established: "1992",
      status: "Aktif Cemerlang",
      tagline: "Ilmu, Budi, Bakti Mahasiswa Pengurusan"
    },
    {
      id: "unimap",
      code: "PERMAS UniMAP",
      name: "Sekretariat Mahasiswa Selangor UniMAP Perlis",
      university: "Universiti Malaysia Perlis",
      shortUni: "UniMAP",
      type: "UA",
      zone: "Zon Utara",
      state: "Perlis",
      location: "Arau & Pauh Putra, Perlis",
      lat: 6.4485,
      lng: 100.2811,
      membersCount: 1150,
      president: "Amirul Asyraf bin Zulkarnain",
      contact: "+60 17-889 0011",
      instagram: "@permas_unimap",
      established: "2006",
      status: "Aktif",
      tagline: "Inovasi Kejuruteraan Di Puncak Utara"
    },

    // 4. ZON PANTAI TIMUR (PAHANG, TERENGGANU, KELANTAN)
    {
      id: "umpsa",
      code: "PERMAS UMPSA",
      name: "Persatuan Mahasiswa Selangor UMPSA Pahang",
      university: "Universiti Malaysia Pahang Al-Sultan Abdullah",
      shortUni: "UMPSA",
      type: "UA",
      zone: "Zon Pantai Timur",
      state: "Pahang",
      location: "Pekan & Gambang, Kuantan, Pahang",
      lat: 3.5437,
      lng: 103.4289,
      membersCount: 1620,
      president: "Ahmad Amirul Irfan bin Ahmad Saupi",
      contact: "+60 19-778 9900",
      instagram: "@permas_umpsa",
      established: "2005",
      status: "Aktif Cemerlang",
      tagline: "Teknologi Kejuruteraan Demi Kemajuan Komuniti"
    },
    {
      id: "unisza",
      code: "PERMAS UniSZA",
      name: "Persatuan Mahasiswa Selangor UniSZA Terengganu",
      university: "Universiti Sultan Zainal Abidin",
      shortUni: "UniSZA",
      type: "UA",
      zone: "Zon Pantai Timur",
      state: "Terengganu",
      location: "Gong Badak, Kuala Terengganu",
      lat: 5.3986,
      lng: 103.0831,
      membersCount: 1490,
      president: "Muhamad Amirul Irfan bin Amir Hamzah",
      contact: "+60 18-901 2345",
      instagram: "@permas_unisza",
      established: "2008",
      status: "Aktif",
      tagline: "Ilmu & Akhlak Teras Kepimpinan Siswa"
    },
    {
      id: "umt",
      code: "PERMAS UMT",
      name: "Persatuan Mahasiswa Selangor UMT Kuala Nerus",
      university: "Universiti Malaysia Terengganu",
      shortUni: "UMT",
      type: "UA",
      zone: "Zon Pantai Timur",
      state: "Terengganu",
      location: "Kuala Nerus, Terengganu",
      lat: 5.4089,
      lng: 103.0872,
      membersCount: 1350,
      president: "Nur Farzana binti Rosman",
      contact: "+60 14-223 5566",
      instagram: "@permas_umt",
      established: "2007",
      status: "Aktif",
      tagline: "Oseanografi & Kelestarian Maritim"
    },
    {
      id: "umk",
      code: "PERMAS UMK",
      name: "Persatuan Mahasiswa Selangor UMK Kelantan",
      university: "Universiti Malaysia Kelantan",
      shortUni: "UMK",
      type: "UA",
      zone: "Zon Pantai Timur",
      state: "Kelantan",
      location: "Bachok, Pengkalan Chepa & Jeli, Kelantan",
      lat: 6.0125,
      lng: 102.4167,
      membersCount: 1280,
      president: "Zulhilmi bin Baharuddin",
      contact: "+60 13-990 1122",
      instagram: "@permas_umk",
      established: "2009",
      status: "Aktif",
      tagline: "Keusahawanan Teras Mahasiswa Berdaya Saing"
    },

    // 5. ZON BORNEO (SARAWAK & SABAH)
    {
      id: "unimas",
      code: "PERMAS UNIMAS",
      name: "Sekretariat Mahasiswa Selangor UNIMAS Sarawak",
      university: "Universiti Malaysia Sarawak",
      shortUni: "UNIMAS",
      type: "UA",
      zone: "Borneo",
      state: "Sarawak",
      location: "Kota Samarahan, Sarawak",
      lat: 1.4649,
      lng: 110.4271,
      membersCount: 980,
      president: "Dayang Najwa binti Abang Kassim",
      contact: "+60 19-332 1100",
      instagram: "@permas_unimas",
      established: "2012",
      status: "Aktif Cemerlang",
      tagline: "Merentas Laut China Selatan Demi Selangor"
    },
    {
      id: "ums",
      code: "PERMAS UMS",
      name: "Sekretariat Mahasiswa Selangor UMS Sabah",
      university: "Universiti Malaysia Sabah",
      shortUni: "UMS",
      type: "UA",
      zone: "Borneo",
      state: "Sabah",
      location: "Kota Kinabalu, Sabah",
      lat: 6.0336,
      lng: 116.1215,
      membersCount: 1050,
      president: "Mohd Danial bin Junaidi",
      contact: "+60 16-887 6655",
      instagram: "@permas_ums",
      established: "2013",
      status: "Aktif",
      tagline: "Eko-Kampus & Perpaduan Mahasiswa Perantauan"
    },

    // 6. GABUNGAN IPTS BERSEKUTU
    {
      id: "ipts-alliance",
      code: "PERMAS IPTS",
      name: "Gabungan Mahasiswa Selangor IPTS (Taylor's, Sunway, MMU, UNITEN, Unisel)",
      university: "Institusi Pengajian Tinggi Swasta",
      shortUni: "IPTS",
      type: "IPTS",
      zone: "Zon Tengah",
      state: "Selangor & KL",
      location: "Lembah Klang & Cyberjaya",
      lat: 2.9278,
      lng: 101.6419,
      membersCount: 4200,
      president: "Brandon Tan & Arif Hakimi",
      contact: "+60 12-889 9776",
      instagram: "@permas_ipts",
      established: "2015",
      status: "Aktif Cemerlang",
      tagline: "Sinergi Kolektif Mahasiswa Swasta Berwawasan"
    }
  ],

  initiatives: [
    {
      id: "dermasiswa",
      title: "Dermasiswa Siswa Selangor",
      category: "Kewangan & Tajaan",
      value: "Sehingga RM5,000 / Tahun",
      target: "Mahasiswa Ijazah & Diploma Asal Selangor (B40 & M40)",
      description: "Bantuan khas pembiayaan yuran pengajian dan sara hidup secara 'one-off' atau tahunan dengan kerjasama Lembaga Zakat Selangor & Yayasan Selangor.",
      features: [
        "Tiada ikatan kontrak pembayaran balik",
        "Keutamaan kepada keluarga berpendapatan bawah RM8,000",
        "Terbuka kepada pelajar IPTA & IPTS diiktiraf MQA"
      ],
      icon: "graduation-cap",
      badgeColor: "from-amber-500 to-yellow-600",
      isOpen: true
    },
    {
      id: "laptop",
      title: "Skim Komputer Riba Siswa Selangor",
      category: "Peranti Digital",
      value: "Unit Laptop Percuma + Beg & Aksesori",
      target: "Pelajar Tahun 1 & 2 IPTA/IPTS dari keluarga B40",
      description: "Inisiatif pemerkasaan digital bagi memastikan anak Selangor memiliki peralatan teknologi moden untuk pembelajaran hibrid dan projek AI.",
      features: [
        "Spesifikasi terkini (Core i5 / Ryzen 5, 16GB RAM, SSD)",
        "Termasuk jaminan rasmi pengeluar 2 tahun",
        "Perisian produktiviti & perlesenan pembelajaran percuma"
      ],
      icon: "laptop",
      badgeColor: "from-blue-500 to-indigo-600",
      isOpen: true
    },
    {
      id: "tiket-kasih",
      title: "Tiket Kasih Siswa Selangor",
      category: "Pengangkutan",
      value: "Subsidi 50% - 100% Tambang Perjalanan",
      target: "Mahasiswa Selangor di IPT Luar Lembah Klang & Borneo",
      description: "Subsidi pengangkutan bas ekspres, ETS, dan penerbangan domestik untuk pulang ke kampung halaman sempena cuti perayaan Aidilfitri, Tahun Baru Cina & cuti semester.",
      features: [
        "Kerjasama rasmi bersama syarikat penerbangan & bas",
        "Pemberian baucar tunai terus ke e-Wallet siswa",
        "Diselaraskan oleh cawangan PERMAS Zon berkenaan"
      ],
      icon: "plane",
      badgeColor: "from-red-500 to-rose-600",
      isOpen: true
    },
    {
      id: "gams",
      title: "Geran Aktiviti Mahasiswa Selangor (GAMS)",
      category: "Pemerkasaan Kelab",
      value: "Dana Geran Sehingga RM10,000 / Program",
      target: "Kelab, Cawangan PERMAS & Persatuan Mahasiswa IPT",
      description: "Dana suntikan pemula untuk menganjurkan program kemasyarakatan, inovasi sains & teknologi, kepimpinan mahasiswa, dan karnival sukan.",
      features: [
        "Kelulusan pantas dalam tempoh 14 hari bekerja",
        "Bimbingan mentor daripada Majlis Eksekutif PERMAS",
        "Pengiktirafan rasmi sijil kolaborasi peringkat negeri"
      ],
      icon: "award",
      badgeColor: "from-emerald-500 to-teal-600",
      isOpen: true
    },
    {
      id: "baucar-buku",
      title: "Baucar Buku Digital Siswa Selangor",
      category: "Akademik & Rujukan",
      value: "RM200 Kredit e-Buku / Pelajar",
      target: "Seluruh Mahasiswa Anak Selangor Aktif Berdaftar",
      description: "Kredit penebusan bagi pembelian buku rujukan akademik, modul kemahiran, jurnal ilmiah dan bahan bacaan ilmiah melalui platform e-dagang berdaftar.",
      features: [
        "Penebusan terus melalui ID Portal Mahasiswa PERMAS",
        "Akses percuma ke arkib digital dan kertas seminar lepas",
        "Boleh digunakan di kedai buku universiti terpilih"
      ],
      icon: "book-open",
      badgeColor: "from-purple-500 to-violet-600",
      isOpen: false,
      note: "Pendaftaran Fasa 2 akan dibuka Julai 2026"
    },
    {
      id: "sispro",
      title: "SISPRO (Selangor Internship Programme)",
      category: "Kerjaya & Industri",
      value: "Elaun Bulanan RM1,200 - RM1,800 + Elaun Penginapan",
      target: "Mahasiswa Semester Akhir (Diploma & Ijazah)",
      description: "Penempatan praktikal di syarikat berkaitan kerajaan negeri (GLC Selangor), badan berkanun, syarikat korporat berprestij dan agensi inovasi Selangor.",
      features: [
        "Jaminan bimbingan mentor eksekutif industri",
        "Peluang serapan kerja tetap selepas tamat latihan",
        "Modul latihan pengurusan kepimpinan Korporat Muda"
      ],
      icon: "briefcase",
      badgeColor: "from-cyan-500 to-blue-600",
      isOpen: true
    }
  ],

  news: [
    {
      id: "konvensyen-2026",
      title: "Konvensyen Mahasiswa Selangor Kebangsaan 2026: Lontar 9 Resolusi Pemerkasaan Belia Siswa",
      category: "Kenyataan Media",
      date: "10 November 2026",
      readTime: "4 min bacaan",
      summary: "Lebih 1,500 delegasi mahasiswa anak Selangor dari 38 IPT seluruh Malaysia berhimpun di Pusat Konvensyen Shah Alam (SACC) bagi membentangkan kertas dasar masa depan belia negeri.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
      author: "Biro Komunikasi Strategik PERMAS",
      content: `SHAH ALAM - Konvensyen Mahasiswa Selangor Kebangsaan (KMS) 2026 melabuhkan tirainya dengan penyerahan Memorandum Resolusi Mahasiswa Selangor kepada pimpinan kerajaan negeri.

Antara teras utama yang digariskan termasuklah tuntutan penambahan kuota dermasiswa kepada keluarga kelas penengah (M40), pewujudan Hab Inkubator AI Belia Mahasiswa di Shah Alam, dan jaminan penempatan kerja berkualiti dengan gaji bermaruah bagi graduan baharu.

Presiden PERMAS Nasional, Muhammad Danish Haikal menegaskan bahawa mahasiswa Selangor bukan sekadar penuntut ilmu di menara gading, malah merupakan rakan kongsi strategik dalam menjayakan Pelan Pembangunan Selangor Berdaya Saing.`
    },
    {
      id: "misi-prihatin",
      title: "Skuad Prihatin PERMAS Mobilisasi 300 Mahasiswa Sukarelawan Bantu Komuniti Banjir Kilat",
      category: "Aktiviti Kebajikan",
      date: "28 Oktober 2026",
      readTime: "3 min bacaan",
      summary: "Tindakan pantas skuad sukarelawan PERMAS Nasional berjaya membersihkan 85 kediaman penduduk terjejas di daerah Hulu Langat dan Kuala Selangor dalam tempoh 48 jam.",
      image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
      author: "Exco Sukarelawan PERMAS",
      content: `HULU LANGAT - Menyahut seruan keprihatinan masyarakat, Persatuan Mahasiswa Selangor (PERMAS) Nasional telah menggerakkan seramai 300 orang mahasiswa sukarelawan menerusi operasi khas pembersihan pasca banjir kilat.

Inisiatif ini turut disertai oleh wakil-wakil cawangan PERMAS UKM, UPM dan UiTM yang lengkap dengan peralatan pembersihan tekanan tinggi dan bekalan pek makanan asas ihsan sumbangan orang ramai.`
    },
    {
      id: "karnival-kerjaya",
      title: "Karnival Kerjaya & Kemahiran Bakat Siswa Selangor Tawar Lebih 3,500 Peluang Kerjaya Baharu",
      category: "Kerjaya & Kebolehpasaran",
      date: "15 Oktober 2026",
      readTime: "5 min bacaan",
      summary: "Kolaborasi mega PERMAS bersama 45 syarikat multinasional teknologi dan kewangan membuka pintu temu duga terus (walk-in interview) untuk graduan anak Selangor.",
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
      author: "Exco Kebolehpasaran Kerjaya",
      content: `KUALA LUMPUR - Program tahunan Selangor Graduate Career Fair anjuran PERMAS Nasional mencatatkan rekod kehadiran luar biasa dengan lebih 6,000 mahasiswa dan graduan hadir sepanjang program dua hari berlangsung.

Pelbagai sesi 'resume clinic', bengkel simulasi temu duga eksekutif, dan taklimat geran permulaan perniagaan belia turut diadakan bagi memberi nilai tambah holistik kepada para peserta.`
    },
    {
      id: "townhall-mb",
      title: "Townhall Belia Mahasiswa Selangor: Dialog Terbuka Dua Hala Bersama YAB Menteri Besar",
      category: "Wacana Pemikiran",
      date: "02 Oktober 2026",
      readTime: "4 min bacaan",
      summary: "Sesi dialog tanpa tapisan mengangkat isu kos sara hidup mahasiswa, rumah sewa mampu milik, dan akses mobiliti bas percuma Smart Selangor ke kampus IPT.",
      image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
      author: "Sekretariat Akhbar PERMAS",
      content: `SHAH ALAM - Sesi Townhall yang dihadiri oleh pimpinan tertinggi Kerajaan Negeri Selangor membuktikan komitmen berterusan dalam mendengar degup jantung dan aspirasi mahasiswa di peringkat akar umbi.

Kerajaan negeri bersetuju untuk mengkaji laluan baharu Bas Smart Selangor yang menghubungkan stesen MRT/LRT utama ke kampus-kampus pengajian tinggi dengan kepadatan mahasiswa Selangor yang tinggi.`
    }
  ],

  calendarEvents: [
    {
      id: "kms-2026",
      title: "Konvensyen Mahasiswa Selangor (KMS 2026)",
      date: "24 – 25 Mac 2026",
      dayMonth: "24-25 MAC",
      time: "8:30 Pagi – 5:30 Petang",
      location: "Pusat Konvensyen Shah Alam (SACC)",
      type: "Sidang Kemuncak",
      category: "kemuncak",
      target: "500 Delegasi 38 Kampus IPT",
      seats: "Baki 65 Tempat",
      status: "Pendaftaran Dibuka",
      summary: "Sidang induk menghimpunkan perwakilan mahasiswa 38 institusi untuk menggubal 7 Resolusi Aspirasi Siswa Selangor 2026–2030.",
      highlight: "Perasmian oleh YAB Dato' Seri Amirudin Shari, Dato' Menteri Besar Selangor",
      image: "assets/images/campus_life.jpg"
    },
    {
      id: "sukmas-2026",
      title: "Kejohanan Sukan Mahasiswa Selangor (SUKMAS 2026)",
      date: "12 – 14 Jun 2026",
      dayMonth: "12-14 JUN",
      time: "8:00 Pagi – 7:00 Petang",
      location: "Kompleks Sukan Panasonic, Shah Alam",
      type: "Sukan & Rekreasi",
      category: "sukan",
      target: "1,400 Atlet Mahasiswa 20 UA",
      seats: "Pendaftaran Kontinjen Dibuka",
      status: "Pendaftaran Dibuka",
      summary: "Mempertandingkan 8 acara utama termasuk Futsal, Bola Jaring, E-Sukan (MLBB/EAFC), Badminton, dan Olahraga antara cawangan zon.",
      highlight: "Piala Pusingan YB EXCO Belia, Sukan & Keusahawanan Negeri Selangor",
      image: "assets/images/study_group.jpg"
    },
    {
      id: "hackathon-2026",
      title: "Selangor Youth Tech, Data & AI Hackathon",
      date: "18 – 19 Julai 2026",
      dayMonth: "18-19 JUL",
      time: "48 Jam Tanpa Henti",
      location: "Selangor Digital Creative Centre (SDAC), i-City",
      type: "Inovasi & AI",
      category: "inovasi",
      target: "60 Pasukan Siswa Pembangun",
      seats: "20 Slot Pasukan Tinggal",
      status: "Pendaftaran Dibuka",
      summary: "Cabaran membina penyelesaian digital pintar untuk Smart Selangor, logistik banjir komuniti, dan platform kebajikan pelajar berkuasa AI.",
      highlight: "Hadiah terkumpul RM30,000 & penempatan inkubator pemula Sidec",
      image: "assets/images/hero_student.jpg"
    },
    {
      id: "kemgara-2026",
      title: "Misi Kembara Bakti & Sukarelawan Siswa Prihatin",
      date: "20 – 23 Ogos 2026",
      dayMonth: "20-23 OGS",
      time: "4 Hari 3 Malam",
      location: "Daerah Hulu Langat & Kuala Selangor",
      type: "Khidmat Komuniti",
      category: "kebajikan",
      target: "250 Sukarelawan Mahasiswa",
      seats: "Pendaftaran Sukarelawan",
      status: "Dibuka",
      summary: "Khidmat masyarakat merangkumi kelas tuisyen percuma SPM anak asnaf, pembersihan saliran sungai pencegahan banjir, dan baik pulih rumah warga emas.",
      highlight: "Kerjasama Pejabat Daerah & Tanah serta Jawatankuasa Bencana Negeri",
      image: "assets/images/study_group.jpg"
    },
    {
      id: "leadership-2026",
      title: "Akademi Kepimpinan Eksekutif Mahasiswa (AKEM)",
      date: "12 September 2026",
      dayMonth: "12 SEP",
      time: "9:00 Pagi – 5:00 Petang",
      location: "Auditorium Dewan Jubli Perak SUK, Shah Alam",
      type: "Kepimpinan",
      category: "kepimpinan",
      target: "200 Pimpinan Mahasiswa & MPP",
      seats: "Tempat Terhad",
      status: "Akan Datang",
      summary: "Bengkel tadbir urus persatuan, pengurusan belanjawan kewangan beraudit, undang-undang hak siswa, dan seni komunikasi media massa.",
      highlight: "Modul bimbingan khas bersama Setiausaha Kerajaan Negeri Selangor (SUK)",
      image: "assets/images/graduation.jpg"
    },
    {
      id: "townhall-2026",
      title: "Townhall Siswa Bersama YAB Dato' Menteri Besar Selangor",
      date: "16 Oktober 2026",
      dayMonth: "16 OKT",
      time: "2:30 Petang – 6:00 Petang",
      location: "Pusat Kebudayaan & Kesenian Sultan Salahuddin Abdul Aziz Shah, UPM",
      type: "Sesi Dialog Awam",
      category: "kemuncak",
      target: "2,000 Mahasiswa Selangor",
      seats: "Pra-Pendaftaran Dibuka",
      status: "Pendaftaran Dibuka",
      summary: "Pentas dialog terbuka dan sesi soal jawab langsung antara mahasiswa dengan kepimpinan kerajaan negeri menjelang Belanjawan Negeri Selangor 2027.",
      highlight: "Pelancaran Skim Insentif Graduan Anak Selangor 2027",
      image: "assets/images/hero_student.jpg"
    }
  ],

  faqs: [
    {
      q: "Siapakah yang layak mendaftar sebagai ahli PERMAS Nasional?",
      a: "Semua warganegara Malaysia yang berstatus anak Selangor (lahir di Selangor atau sekurang-kurangnya salah seorang ibu/bapa lahir di Selangor, atau telah menetap di Selangor melebihi 10 tahun) yang sedang menuntut di mana-mana Institusi Pengajian Tinggi Awam (IPTA) atau Swasta (IPTS) di peringkat Sijil, Diploma, Ijazah Sarjana Muda mahupun Pascasiswazah."
    },
    {
      q: "Adakah pendaftaran keahlian PERMAS dikenakan sebarang yuran tahunan?",
      a: "Pendaftaran keahlian rasmi PERMAS Nasional adalah 100% PERCUMA. Setiap mahasiswa anak Selangor yang berdaftar layak memohon bantuan dermasiswa, geran kebajikan, dan menyertai program kepimpinan yang disediakan."
    },
    {
      q: "Bagaimanakah cara untuk mengetahui syarat bantuan Dermasiswa atau Komputer Riba Siswa?",
      a: "Anda boleh merujuk ruangan 'Info Inisiatif Bantuan' di portal ini untuk melihat syarat kelayakan dan senarai dokumen lengkap bagi setiap skim bantuan yang ditawarkan bersama Yayasan Selangor dan Lembaga Zakat Selangor."
    },
    {
      q: "Bagaimanakah cawangan kampus boleh memohon Geran Aktiviti Mahasiswa (GAMS)?",
      a: "Pimpinan cawangan IPT boleh berhubung terus dengan Sekretariat PERMAS Kebangsaan bagi mendapatkan panduan kertas kerja GAMS dan menyelaraskan permohonan sekurang-kurangnya 21 hari sebelum tarikh program berlangsung."
    },
    {
      q: "Bagaimanakah saya boleh membuat aduan atau menyuarakan isu kebajikan siswa di kampus saya?",
      a: "Sila gunakan ruangan 'Meja Suara & E-Aduan' di laman ini. Setiap aduan yang dihantar akan diterima terus oleh Biro Kebajikan & Advokasi PERMAS untuk diselaraskan bersama pihak pengurusan universiti atau agensi berkaitan."
    }
  ]
};

/* ============================================================================
   SHARED LEADERSHIP PORTRAIT & PHOTO UPLOAD CONTROLLER
============================================================================ */
let _activeLeaderUploadId = null;
let _leaderToastTimer = null;

function escLeaderHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getLeaderPhotoSrc(leader) {
  if (!leader) return '';
  try {
    const cached = localStorage.getItem('permas_leader_photo_' + leader.id);
    if (cached && cached.startsWith('data:image/')) return cached;
  } catch (e) {}
  return leader.photo || `assets/ahli/${leader.id}.jpg`;
}

function showLeaderUploadToast(message, isError = false) {
  let toast = document.getElementById('permas-leader-upload-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'permas-leader-upload-toast';
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl border backdrop-blur-md transition-all duration-300 opacity-0 translate-y-2 pointer-events-none flex items-center gap-2 max-w-[92vw] text-center';
    document.body.appendChild(toast);
  }
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl border backdrop-blur-md transition-all duration-300 flex items-center gap-2 max-w-[92vw] text-center ${
    isError
      ? 'bg-red-950/95 border-red-500/50 text-red-100'
      : 'bg-slate-900/95 border-amber-400/50 text-amber-200'
  }`;
  toast.textContent = message;
  clearTimeout(_leaderToastTimer);
  _leaderToastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
  }, 4200);
}

window.handleLeaderImgError = function (leaderId) {
  document.querySelectorAll(`[data-leader-img="${leaderId}"]`).forEach((img) => {
    img.classList.add('hidden');
  });
  document.querySelectorAll(`[data-leader-fallback="${leaderId}"]`).forEach((fb) => {
    fb.classList.remove('hidden');
  });
};

window.refreshLeaderPhotoDom = function (leaderId, src) {
  document.querySelectorAll(`[data-leader-img="${leaderId}"]`).forEach((img) => {
    img.src = src;
    img.classList.remove('hidden');
  });
  document.querySelectorAll(`[data-leader-fallback="${leaderId}"]`).forEach((fb) => {
    fb.classList.add('hidden');
  });
};

window.triggerLeaderPhotoUpload = function (leaderId) {
  _activeLeaderUploadId = leaderId;
  let input = document.getElementById('leader-photo-input') || document.getElementById('home-leader-photo-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'leader-photo-input';
    input.accept = 'image/*';
    input.className = 'hidden';
    input.onchange = window.handleLeaderPhotoSelected;
    document.body.appendChild(input);
  }
  input.click();
};

window.handleLeaderPhotoSelected = function (event) {
  const input = event.target;
  const file = input && input.files && input.files[0];
  const leaderId = _activeLeaderUploadId;
  if (input) input.value = '';
  if (!file || !leaderId) return;

  showLeaderUploadToast('⏳ Memproses & menyimpan potret rasmi...');

  const reader = new FileReader();
  reader.onerror = () => showLeaderUploadToast('❌ Gagal membaca fail gambar yang dipilih.', true);
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => showLeaderUploadToast('❌ Format gambar tidak disokong.', true);
    img.onload = async () => {
      const maxW = 900;
      const maxH = 1125;
      let targetW = img.naturalWidth || img.width;
      let targetH = img.naturalHeight || img.height;
      const ratio = Math.min(maxW / targetW, maxH / targetH, 1);
      targetW = Math.max(1, Math.round(targetW * ratio));
      targetH = Math.max(1, Math.round(targetH * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      window.refreshLeaderPhotoDom(leaderId, dataUrl);

      try {
        const res = await fetch('/api/upload-leader-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: leaderId, dataUrl })
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.status === 'ok') {
            try {
              localStorage.removeItem('permas_leader_photo_' + leaderId);
            } catch (e) {}
            window.refreshLeaderPhotoDom(leaderId, `${result.path}?_t=${Date.now()}`);
            showLeaderUploadToast(`✅ Gambar disimpan ke ${result.path} & akan auto-sync ke GitHub!`);
            return;
          }
        }
      } catch (e) {}

      try {
        localStorage.setItem('permas_leader_photo_' + leaderId, dataUrl);
      } catch (e) {}
      showLeaderUploadToast(`💾 Pratonton disimpan di pelayar (buka melalui localhost:3000 untuk simpan ke assets/ahli/${leaderId}.jpg).`);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
};

window.renderLeaderPortraitCard = function (l, options = {}) {
  const compact = Boolean(options.compact);
  let badgeClass = 'badge-tertinggi';
  let sectionLabel = 'Majlis Tertinggi';
  if (l.section === 'pembangunan') {
    badgeClass = 'badge-pembangunan';
    sectionLabel = 'Pembangunan & Pemerkasaan';
  } else if (l.section === 'kebajikan') {
    badgeClass = 'badge-kebajikan';
    sectionLabel = 'Kebajikan Mahasiswa';
  } else if (l.section === 'komunikasi') {
    badgeClass = 'badge-komunikasi';
    sectionLabel = 'Komunikasi & Korporat';
  }

  const isSpecial = l.featuredBadge || l.featured;
  const borderCard = isSpecial
    ? 'border-amber-400/50 ring-1 ring-amber-400/30 shadow-lg shadow-amber-950/20'
    : 'border-slate-800 hover:border-amber-400/40';
  const safeName = escLeaderHtml(l.name);
  const safePos = escLeaderHtml(l.position);
  const safeInst = escLeaderHtml(l.institution);
  const safeQuote = escLeaderHtml(l.quote);
  const safeEmail = escLeaderHtml((l.social && l.social.email) || 'permasnasionalofficial@gmail.com');

  if (l.section !== 'tertinggi') {
    const roleAccent = l.section === 'pembangunan'
      ? 'bg-blue-900/80 border-blue-500/40 text-blue-200'
      : l.section === 'kebajikan'
      ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200'
      : 'bg-amber-900/70 border-amber-500/40 text-amber-200';

    return `
      <div class="pro-card rounded-2xl border ${borderCard} bg-slate-900/95 flex flex-col justify-between overflow-hidden transition-all group p-5" data-tilt-3d>
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="leader-badge-pill ${badgeClass}">${sectionLabel}</span>
            <span class="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-700 text-amber-300 tracking-wider">
              ${escLeaderHtml(l.shortUni)}
            </span>
          </div>

          <div class="pt-1">
            <span class="inline-block px-2.5 py-0.5 rounded-full border ${roleAccent} text-[10px] font-extrabold uppercase tracking-wider mb-2">
              ${escLeaderHtml(l.roleCode)}
            </span>
            <span class="text-[11px] uppercase font-bold tracking-wider text-amber-300 block">
              ${safePos}
            </span>
            <h4 class="font-extrabold text-[15px] text-white group-hover:text-amber-300 transition leading-snug mt-0.5">
              ${safeName}
            </h4>
            <p class="text-xs text-slate-400 font-medium mt-1 line-clamp-1">
              ${safeInst}
            </p>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed italic border-l-2 border-red-700/70 pl-2.5 py-0.5 line-clamp-3">
            &ldquo;${safeQuote}&rdquo;
          </p>
        </div>

        <div class="pt-3 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span class="text-[11px] font-semibold text-slate-400">PERMAS 24/26</span>
          <a href="mailto:${safeEmail}" class="text-red-400 hover:text-amber-300 font-bold hover:underline inline-flex items-center gap-1 transition">
            <span>Hubungi</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>
    `;
  }

  const photoSrc = getLeaderPhotoSrc(l);
  const frameHeight = compact ? 'h-56' : 'h-72';

  return `
    <div class="pro-card rounded-2xl border ${borderCard} bg-slate-900/95 flex flex-col justify-between overflow-hidden transition-all group" data-tilt-3d>
      <div>
        <div class="relative ${frameHeight} overflow-hidden bg-gradient-to-b from-slate-900 via-red-950/60 to-slate-950 border-b border-slate-800">
          <img id="leader-img-${l.id}" data-leader-img="${l.id}" src="${photoSrc}" alt="${safeName}"
            class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onerror="handleLeaderImgError('${l.id}')">

          <div id="leader-fallback-${l.id}" data-leader-fallback="${l.id}"
            class="hidden absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-900 via-red-950/50 to-slate-950">
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-red-700 to-amber-500 p-0.5 shadow-lg mb-3">
              <div class="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-300">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 font-black font-heading text-[10px] tracking-wider uppercase">
              ${escLeaderHtml(l.roleCode)}
            </span>
          </div>

          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/35 pointer-events-none"></div>

          <div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
            <span class="leader-badge-pill ${badgeClass} shadow-sm">${sectionLabel}</span>
            <span class="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-700 text-amber-300 tracking-wider backdrop-blur-sm">
              ${escLeaderHtml(l.shortUni)}
            </span>
          </div>
        </div>

        <div class="${compact ? 'p-4' : 'p-5'} space-y-2">
          <span class="text-[10px] uppercase font-bold tracking-wider text-amber-300 block line-clamp-1">
            ${safePos}
          </span>
          <h4 class="font-extrabold ${compact ? 'text-sm' : 'text-[15px]'} text-white group-hover:text-amber-300 transition leading-snug">
            ${safeName}
          </h4>
          <p class="text-xs text-slate-400 font-medium line-clamp-1">
            ${safeInst}
          </p>
          ${compact ? '' : `
            <p class="text-xs text-slate-300 leading-relaxed italic border-l-2 border-red-700/70 pl-2.5 py-0.5 mt-2 line-clamp-3">
              &ldquo;${safeQuote}&rdquo;
            </p>
          `}
        </div>
      </div>

      <div class="${compact ? 'px-4 pb-4 pt-2.5' : 'px-5 pb-4 pt-3'} border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span class="text-[11px] font-semibold text-slate-400">PERMAS 24/26</span>
        <a href="mailto:${safeEmail}" class="text-red-400 hover:text-amber-300 font-bold hover:underline inline-flex items-center gap-1 transition">
          <span>Hubungi</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
      </div>
    </div>
  `;
};


