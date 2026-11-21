const loginButton = document.getElementById('loginButton');
const loginPopup = document.getElementById('loginPopup');
const closeButton = document.getElementById('closeButton');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabButtons = document.querySelectorAll('.tab-btn');

// Pindah tab dengan memastikan hanya form yang dipilih terlihat.
function showTab(targetId) {
    tabButtons.forEach(function (button) {
        const isActive = button.dataset.target === targetId;
        button.classList.toggle('active', isActive);
    });

    [loginForm, registerForm].forEach(function (form) {
        form.classList.toggle('hidden', form.id !== targetId);
    });
}

// Buka popup dari tab Login dan cegah halaman belakang ikut bergulir.
function openPopup() {
    showTab('loginForm');
    loginPopup.classList.remove('hidden');
    document.body.classList.add('no-scroll');
    loadProvinces();
}

// Tutup popup dan kembalikan gulir halaman.
function closePopup() {
    loginPopup.classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

loginButton.addEventListener('click', openPopup);
closeButton.addEventListener('click', closePopup);

tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        showTab(button.dataset.target);
    });
});

// Popup juga ditutup dengan klik area gelap atau tombol Escape.
loginPopup.addEventListener('click', function (event) {
    if (event.target === loginPopup) {
        closePopup();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !loginPopup.classList.contains('hidden')) {
        closePopup();
    }
});

// Tombol mata untuk menampilkan atau menyembunyikan password Login.
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
});

// Tombol mata untuk menampilkan password saat pendaftaran.
const toggleRegPassword = document.getElementById('toggleRegPassword');
const registerPassword = document.getElementById('regPassword');

toggleRegPassword.addEventListener('click', function () {
    const showPassword = registerPassword.type === 'password';
    registerPassword.type = showPassword ? 'text' : 'password';
    toggleRegPassword.setAttribute('aria-label', showPassword ? 'Sembunyikan password' : 'Tampilkan password');
    toggleRegPassword.setAttribute('aria-pressed', String(showPassword));
});

// Data wilayah di GitHub Raw dapat diakses dari browser lokal tanpa API key.
const regionApiBase = 'https://raw.githubusercontent.com/ibnux/data-indonesia/master';
const provinceSelect = document.getElementById('provinsi');
const regencySelect = document.getElementById('kabupaten');
const districtSelect = document.getElementById('kecamatan');
const villageSelect = document.getElementById('desa');
let provincesLoaded = false;
let provincesLoading = false;

// Siapkan satu pilihan awal, lalu nonaktifkan dropdown yang belum bisa dipakai.
function resetSelect(select, placeholder, disabled) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    select.appendChild(option);
    select.disabled = disabled;
}

// Tampilkan status saat data sedang diminta.
function showLoading(select) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Memuat...';
    select.appendChild(option);
    select.disabled = true;
}

// Tampilkan pilihan gagal dan opsi untuk mencoba lagi bila permintaan gagal.
function showLoadError(select) {
    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Pilih --';
    select.appendChild(placeholder);

    const errorOption = document.createElement('option');
    errorOption.value = '__retry__';
    errorOption.textContent = 'Gagal memuat data, coba lagi';
    select.appendChild(errorOption);
    select.disabled = false;
}

// Ambil daftar wilayah dan simpan ID hanya di dataset, bukan pada value.
async function loadRegions(select, url, placeholder) {
    showLoading(select);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Permintaan wilayah gagal.');
        }

        const regions = await response.json();
        if (!Array.isArray(regions)) {
            throw new Error('Format data wilayah tidak sesuai.');
        }

        resetSelect(select, placeholder, false);
        regions.forEach(function (region) {
            const regionName = region.nama || region.name;
            if (!region.id || !regionName) {
                throw new Error('Data wilayah tidak memiliki ID atau nama.');
            }

            const option = document.createElement('option');
            option.value = regionName;
            option.textContent = regionName;
            option.dataset.id = region.id;
            select.appendChild(option);
        });
        return true;
    } catch (error) {
        showLoadError(select);
        return false;
    }
}

// Provinsi diminta sekali saat pertama popup dibuka, dan dapat dicoba ulang jika gagal.
async function loadProvinces() {
    if (provincesLoaded || provincesLoading) {
        return;
    }

    provincesLoading = true;
    resetSelect(regencySelect, '-- Pilih Kabupaten/Kota --', true);
    resetSelect(districtSelect, '-- Pilih Kecamatan --', true);
    resetSelect(villageSelect, '-- Pilih Desa --', true);
    provincesLoaded = await loadRegions(
        provinceSelect,
        regionApiBase + '/propinsi.json',
        '-- Pilih Provinsi --'
    );
    provincesLoading = false;
}

// Reset level lebih bawah sebelum memuat pilihan yang bergantung padanya.
provinceSelect.addEventListener('change', function () {
    if (provinceSelect.value === '__retry__') {
        loadProvinces();
        return;
    }

    resetSelect(regencySelect, '-- Pilih Kabupaten/Kota --', true);
    resetSelect(districtSelect, '-- Pilih Kecamatan --', true);
    resetSelect(villageSelect, '-- Pilih Desa --', true);

    const provinceId = provinceSelect.selectedOptions[0].dataset.id;
    if (provinceId) {
        loadRegions(
            regencySelect,
            regionApiBase + '/kabupaten/' + encodeURIComponent(provinceId) + '.json',
            '-- Pilih Kabupaten/Kota --'
        );
    }
});

regencySelect.addEventListener('change', function () {
    if (regencySelect.value === '__retry__') {
        const provinceId = provinceSelect.selectedOptions[0].dataset.id;
        if (provinceId) {
            loadRegions(
                regencySelect,
                regionApiBase + '/kabupaten/' + encodeURIComponent(provinceId) + '.json',
                '-- Pilih Kabupaten/Kota --'
            );
        }
        return;
    }

    resetSelect(districtSelect, '-- Pilih Kecamatan --', true);
    resetSelect(villageSelect, '-- Pilih Desa --', true);

    const regencyId = regencySelect.selectedOptions[0].dataset.id;
    if (regencyId) {
        loadRegions(
            districtSelect,
            regionApiBase + '/kecamatan/' + encodeURIComponent(regencyId) + '.json',
            '-- Pilih Kecamatan --'
        );
    }
});

districtSelect.addEventListener('change', function () {
    if (districtSelect.value === '__retry__') {
        const regencyId = regencySelect.selectedOptions[0].dataset.id;
        if (regencyId) {
            loadRegions(
                districtSelect,
                regionApiBase + '/kecamatan/' + encodeURIComponent(regencyId) + '.json',
                '-- Pilih Kecamatan --'
            );
        }
        return;
    }

    resetSelect(villageSelect, '-- Pilih Desa --', true);

    const districtId = districtSelect.selectedOptions[0].dataset.id;
    if (districtId) {
        loadRegions(
            villageSelect,
            regionApiBase + '/kelurahan/' + encodeURIComponent(districtId) + '.json',
            '-- Pilih Desa --'
        );
    }
});

villageSelect.addEventListener('change', function () {
    if (villageSelect.value === '__retry__') {
        const districtId = districtSelect.selectedOptions[0].dataset.id;
        if (districtId) {
            loadRegions(
                villageSelect,
                regionApiBase + '/kelurahan/' + encodeURIComponent(districtId) + '.json',
                '-- Pilih Desa --'
            );
        }
    }
});

// Periksa kecocokan password sebelum form pendaftaran dikirim ke server.
const confirmationInput = document.getElementById('regKonfirmasi');
const passwordError = document.createElement('small');
passwordError.className = 'error-text';
passwordError.setAttribute('aria-live', 'polite');
confirmationInput.insertAdjacentElement('afterend', passwordError);

registerForm.addEventListener('submit', function (event) {
    passwordError.textContent = '';

    if (registerPassword.value.length < 6) {
        event.preventDefault();
        passwordError.textContent = 'Password harus minimal 6 karakter.';
        return;
    }

    if (registerPassword.value !== confirmationInput.value) {
        event.preventDefault();
        passwordError.textContent = 'Konfirmasi password tidak sama.';
    }
});
