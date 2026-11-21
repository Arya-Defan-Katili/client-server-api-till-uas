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
    regionPickerBySelect.forEach(function (picker, select) {
        closeRegionPicker(select, true);
    });
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
const regionSearchBySelect = new Map([
    [provinceSelect, document.getElementById('cariProvinsi')],
    [regencySelect, document.getElementById('cariKabupaten')],
    [districtSelect, document.getElementById('cariKecamatan')],
    [villageSelect, document.getElementById('cariDesa')]
]);
const regionPickerBySelect = new Map([
    [provinceSelect, document.getElementById('pickerProvinsi')],
    [regencySelect, document.getElementById('pickerKabupaten')],
    [districtSelect, document.getElementById('pickerKecamatan')],
    [villageSelect, document.getElementById('pickerDesa')]
]);
const regionMenuBySelect = new Map([
    [provinceSelect, document.getElementById('opsiProvinsi')],
    [regencySelect, document.getElementById('opsiKabupaten')],
    [districtSelect, document.getElementById('opsiKecamatan')],
    [villageSelect, document.getElementById('opsiDesa')]
]);
const regionErrorBySelect = new Map([
    [provinceSelect, document.getElementById('errorProvinsi')],
    [regencySelect, document.getElementById('errorKabupaten')],
    [districtSelect, document.getElementById('errorKecamatan')],
    [villageSelect, document.getElementById('errorDesa')]
]);
const regionPlaceholderBySelect = new Map([
    [provinceSelect, '-- Pilih Provinsi --'],
    [regencySelect, '-- Pilih Kabupaten/Kota --'],
    [districtSelect, '-- Pilih Kecamatan --'],
    [villageSelect, '-- Pilih Desa --']
]);
const regionSearchPlaceholderBySelect = new Map([
    [provinceSelect, 'Pilih atau cari provinsi...'],
    [regencySelect, 'Pilih atau cari kabupaten/kota...'],
    [districtSelect, 'Pilih atau cari kecamatan...'],
    [villageSelect, 'Pilih atau cari desa/kelurahan...']
]);
const regionsBySelect = new Map();
const regionLoadErrors = new Set();
let provincesLoaded = false;
let provincesLoading = false;

// Siapkan satu pilihan awal, lalu nonaktifkan dropdown yang belum bisa dipakai.
function resetSelect(select, placeholder, disabled) {
    regionsBySelect.set(select, []);
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    select.appendChild(option);
    select.disabled = disabled;

    const searchInput = regionSearchBySelect.get(select);
    searchInput.value = '';
    searchInput.disabled = disabled;
    searchInput.placeholder = placeholder === 'Memuat...'
        ? 'Memuat data...'
        : regionSearchPlaceholderBySelect.get(select);
    searchInput.setAttribute('aria-expanded', 'false');
    regionPickerBySelect.get(select).classList.remove('open');
    regionMenuBySelect.get(select).innerHTML = '';
    regionMenuBySelect.get(select).hidden = true;
    regionErrorBySelect.get(select).textContent = '';
    regionLoadErrors.delete(select);
}

// Tampilkan status saat data sedang diminta.
function showLoading(select) {
    resetSelect(select, 'Memuat...', true);
}

// Tampilkan pilihan gagal dan opsi untuk mencoba lagi bila permintaan gagal.
function showLoadError(select) {
    resetSelect(select, '-- Pilih --', false);

    const errorOption = document.createElement('option');
    errorOption.value = '__retry__';
    errorOption.textContent = 'Gagal memuat data, coba lagi';
    select.appendChild(errorOption);
    regionSearchBySelect.get(select).disabled = false;
    regionSearchBySelect.get(select).placeholder = 'Gagal memuat data, klik untuk coba lagi';
    regionLoadErrors.add(select);
}

// Tutup dropdown dan kembalikan nama wilayah yang sudah dipilih.
function closeRegionPicker(select, restoreSelection) {
    const searchInput = regionSearchBySelect.get(select);
    const menu = regionMenuBySelect.get(select);
    menu.hidden = true;
    regionPickerBySelect.get(select).classList.remove('open');
    searchInput.setAttribute('aria-expanded', 'false');

    if (restoreSelection) {
        searchInput.value = select.value === '__retry__' ? '' : select.value;
    }
}

// Buat satu pilihan wilayah pada menu dropdown.
function createRegionOption(select, region) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'region-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(select.value === region.name));
    option.textContent = region.name;
    option.addEventListener('click', function () {
        select.value = region.name;
        regionSearchBySelect.get(select).value = region.name;
        regionErrorBySelect.get(select).textContent = '';
        closeRegionPicker(select, false);
        select.dispatchEvent(new Event('change'));
    });
    return option;
}

// Tampilkan daftar pilihan yang sesuai dengan teks pencarian.
function renderRegionOptions(select) {
    const searchInput = regionSearchBySelect.get(select);
    const menu = regionMenuBySelect.get(select);
    const query = searchInput.value.trim().toLowerCase();
    menu.innerHTML = '';

    if (regionLoadErrors.has(select)) {
        const retryOption = document.createElement('button');
        retryOption.type = 'button';
        retryOption.className = 'region-option';
        retryOption.textContent = 'Gagal memuat data, klik untuk coba lagi';
        retryOption.addEventListener('click', function () {
            closeRegionPicker(select, false);
            select.value = '__retry__';
            select.dispatchEvent(new Event('change'));
        });
        menu.appendChild(retryOption);
        return;
    }

    const regions = regionsBySelect.get(select) || [];
    const matchingRegions = regions.filter(function (region) {
        return region.name.toLowerCase().includes(query);
    });

    if (matchingRegions.length === 0) {
        const emptyOption = document.createElement('div');
        emptyOption.className = 'region-empty';
        emptyOption.textContent = 'Tidak ada hasil';
        menu.appendChild(emptyOption);
        return;
    }

    matchingRegions.forEach(function (region) {
        menu.appendChild(createRegionOption(select, region));
    });
}

// Buka menu dan kosongkan nama terpilih agar pengguna bisa mulai mencari.
function openRegionPicker(select) {
    const searchInput = regionSearchBySelect.get(select);
    if (searchInput.disabled) {
        return;
    }

    regionSearchBySelect.forEach(function (otherInput, otherSelect) {
        if (otherSelect !== select) {
            closeRegionPicker(otherSelect, true);
        }
    });

    if (searchInput.value === select.value) {
        searchInput.value = '';
    }
    regionPickerBySelect.get(select).classList.add('open');
    regionMenuBySelect.get(select).hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
    renderRegionOptions(select);
}

// Hubungkan pencarian, pemilihan opsi, dan tombol keyboard di setiap wilayah.
regionSearchBySelect.forEach(function (searchInput, select) {
    const menu = regionMenuBySelect.get(select);

    searchInput.addEventListener('focus', function () {
        openRegionPicker(select);
    });

    searchInput.addEventListener('click', function () {
        if (menu.hidden) {
            openRegionPicker(select);
        }
    });

    searchInput.addEventListener('input', function () {
        if (select.value && select.value !== '__retry__'
            && searchInput.value.trim().toLowerCase() !== select.value.toLowerCase()) {
            select.value = '';
            select.dispatchEvent(new Event('change'));
        }

        regionErrorBySelect.get(select).textContent = '';
        if (menu.hidden) {
            openRegionPicker(select);
        } else {
            renderRegionOptions(select);
        }
    });

    searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeRegionPicker(select, true);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            const firstOption = menu.querySelector('.region-option');
            if (firstOption) {
                firstOption.focus();
            }
        } else if (event.key === 'Enter' && !menu.hidden) {
            const firstOption = menu.querySelector('.region-option');
            if (firstOption) {
                event.preventDefault();
                firstOption.click();
            }
        }
    });

    menu.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeRegionPicker(select, true);
            searchInput.focus();
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const options = Array.from(menu.querySelectorAll('.region-option'));
            const currentIndex = options.indexOf(document.activeElement);
            const nextIndex = event.key === 'ArrowDown'
                ? Math.min(currentIndex + 1, options.length - 1)
                : Math.max(currentIndex - 1, 0);
            if (options[nextIndex]) {
                options[nextIndex].focus();
            }
        }
    });
});

// Tutup dropdown saat klik dilakukan di luar komponen.
document.addEventListener('click', function (event) {
    regionPickerBySelect.forEach(function (picker, select) {
        if (!picker.contains(event.target)) {
            closeRegionPicker(select, true);
        }
    });
});

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

        const normalizedRegions = regions.map(function (region) {
            const regionName = region.nama || region.name;
            if (!region.id || !regionName) {
                throw new Error('Data wilayah tidak memiliki ID atau nama.');
            }

            return { id: region.id, name: regionName };
        });

        regionsBySelect.set(select, normalizedRegions);
        select.innerHTML = '';
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        select.appendChild(placeholderOption);

        normalizedRegions.forEach(function (region) {
            const option = document.createElement('option');
            option.value = region.name;
            option.textContent = region.name;
            option.dataset.id = region.id;
            select.appendChild(option);
        });

        select.disabled = normalizedRegions.length === 0;
        regionSearchBySelect.get(select).disabled = normalizedRegions.length === 0;
        renderRegionOptions(select);
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
        return;
    }

    const invalidRegion = Array.from(regionSearchBySelect.entries()).find(function (entry) {
        const selectedOption = entry[0].selectedOptions[0];
        return !selectedOption || !selectedOption.dataset.id;
    });

    if (invalidRegion) {
        event.preventDefault();
        const select = invalidRegion[0];
        const searchInput = invalidRegion[1];
        const label = searchInput.getAttribute('aria-label').replace('Pilih atau cari ', '');
        regionErrorBySelect.get(select).textContent = 'Pilih ' + label + ' dari daftar.';
        if (!searchInput.disabled) {
            searchInput.focus();
            openRegionPicker(select);
        }
    }
});
