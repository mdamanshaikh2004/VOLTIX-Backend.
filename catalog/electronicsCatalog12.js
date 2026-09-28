/**
 * Twelve additional VOLTIX catalogue products supplied by the project owner.
 *
 * Images are the exact URLs supplied for this catalogue batch. Where an image
 * identifies a known product, specifications were cross-checked against public
 * product/specification sources. Generic images are deliberately named as
 * generic products rather than inventing a manufacturer/model that is not
 * visible in the supplied image.
 */
module.exports = [
  {
    name: 'HP 15.6-inch Touch-Screen Laptop 15-dy4013dx',
    brand: 'HP', model: '15-dy4013dx', subcategory: 'Laptops',
    majorCategory: 'Computers & Laptops',
    description: '15.6-inch touch-screen Windows laptop with an 11th Gen Intel Core i5 processor, 12GB memory and 256GB NVMe SSD.',
    price: 99423, originalPrice: 108867, discount: 9,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6510/6510531ld.jpg'],
    stock: 10, sku: 'HP-15-DY4013DX-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Processor: '11th Gen Intel Core i5-1155G7', RAM: '12 GB DDR4', Storage: '256 GB PCIe NVMe SSD',
      Display: '15.6-inch HD 1366 x 768 Touch, BrightView', GPU: 'Intel Iris Xe Graphics', OS: 'Windows 11 Home in S mode',
      Camera: 'HP True Vision 720p HD', Battery: 'Up to 9.5 hours video playback', Weight: '3.75 lb (1.70 kg)',
      Connectivity: 'Wi-Fi 5, Bluetooth', Touchscreen: 'Yes'
    }, tags: ['HP', 'laptop', 'touchscreen', 'Windows 11', 'Core i5']
  },
  {
    name: 'Dell Inspiron 15 3520',
    brand: 'Dell', model: 'Inspiron 15 3520', subcategory: 'Laptops',
    majorCategory: 'Computers & Laptops',
    description: 'Carbon Black 15.6-inch Windows 11 laptop matching the supplied Dell Inspiron 15 3520 product image.',
    price: 49999, originalPrice: 65867, discount: 24,
    images: ['https://th.bing.com/th/id/OIP.x6bgIpgvcMVR2EkmOiW0TAHaES'],
    stock: 10, sku: 'DELL-INSPIRON-15-3520-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Processor: '12th Gen Intel Core i5-1235U', RAM: '8 GB DDR4', Storage: '512 GB SSD',
      Display: '15.6-inch Full HD 1920 x 1080', GPU: 'Intel integrated graphics', OS: 'Windows 11',
      Color: 'Carbon Black', Ports: 'USB-C, USB-A, HDMI, SD card reader, headset jack',
      Wireless: 'Wi-Fi, Bluetooth', Keyboard: 'Full-size keyboard with numeric keypad'
    }, tags: ['Dell', 'Inspiron', 'laptop', 'Windows 11', 'Core i5']
  },
  {
    name: 'Apple MacBook Air 13-inch 2020',
    brand: 'Apple', model: 'MWTK2LL/A', subcategory: 'Laptops',
    majorCategory: 'Computers & Laptops',
    description: 'Silver 13.3-inch MacBook Air with Retina display, Intel Core i3, 8GB RAM and 256GB SSD.',
    price: 69990, originalPrice: 89900, discount: 22,
    images: ['https://th.bing.com/th/id/OIP.Ys9X5_S3JrfgIc7C_jo3IgHaFf'],
    stock: 8, sku: 'APPLE-MWTK2LLA-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Processor: '10th Gen Intel Core i3, 1.1 GHz dual-core', RAM: '8 GB', Storage: '256 GB SSD',
      Display: '13.3-inch Retina 2560 x 1600', GPU: 'Intel Iris Plus Graphics', OS: 'macOS',
      Security: 'Touch ID', Ports: '2 x Thunderbolt 3 / USB-C, 3.5 mm headphone jack',
      Wireless: '802.11ac Wi-Fi, Bluetooth 5.0', Battery: 'Up to 11 hours'
    }, tags: ['Apple', 'MacBook Air', 'laptop', 'Retina', 'macOS']
  },
  {
    name: 'Apple iPhone 16 Pro',
    brand: 'Apple', model: 'iPhone 16 Pro', subcategory: 'Smartphones',
    majorCategory: 'Mobile & Tablets',
    description: 'Pro iPhone shown in the supplied image with a titanium design, Dynamic Island and triple rear camera system.',
    price: 119900, originalPrice: 119900, discount: 0,
    images: ['https://th.bing.com/th/id/OIP.HptMK5Ev2JMBVP1FKHrEAgHaHa'],
    stock: 10, sku: 'APPLE-IP16PRO-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Processor: 'Apple A18 Pro', RAM: '8 GB class', Storage: '128 GB base variant',
      Screen: '6.3-inch Super Retina XDR OLED', RefreshRate: 'Up to 120 Hz ProMotion',
      Cameras: '48 MP Fusion + 48 MP Ultra Wide + 12 MP Telephoto', FrontCamera: '12 MP TrueDepth',
      Battery: 'Built-in rechargeable lithium-ion', Charging: 'USB-C, MagSafe wireless charging',
      Protection: 'IP68 water and dust resistance'
    }, tags: ['Apple', 'iPhone', 'iPhone 16 Pro', '5G', 'smartphone']
  },
  {
    name: 'ASUS ROG Phone 7',
    brand: 'ASUS', model: 'AI2205', subcategory: 'Smartphones',
    majorCategory: 'Mobile & Tablets',
    description: 'Gaming smartphone with Snapdragon 8 Gen 2, 165Hz AMOLED display, 12GB RAM and 256GB UFS 4.0 storage.',
    price: 74999, originalPrice: 74999, discount: 0,
    images: ['https://dlcdnwebimgs.asus.com/gain/4A2BCCC6-B9D8-47A5-AD7F-501E30A462A9'],
    stock: 8, sku: 'ASUS-ROG7-AI2205-VX12', rating: 0, reviewCount: 0, featured: true,
    specifications: {
      Processor: 'Qualcomm Snapdragon 8 Gen 2, up to 3.2 GHz', RAM: '12 GB LPDDR5X', Storage: '256 GB UFS 4.0',
      Screen: '6.78-inch Samsung AMOLED, 2448 x 1080', RefreshRate: '165 Hz',
      Cameras: '50 MP + 13 MP ultrawide + 5 MP macro', FrontCamera: '32 MP',
      Battery: '6000 mAh', Charging: '65W wired', Protection: 'IP54',
      Connectivity: '5G, Wi-Fi 6/6E, Bluetooth 5.3, NFC', Audio: 'Dual front speakers, 3.5 mm jack'
    }, tags: ['ASUS', 'ROG', 'gaming phone', 'Snapdragon 8 Gen 2', '165Hz']
  },
  {
    name: 'ZTE Blade V60 Design',
    brand: 'ZTE', model: 'Z2350', subcategory: 'Smartphones',
    majorCategory: 'Mobile & Tablets',
    description: '6.6-inch 90Hz Android smartphone with Unisoc T606, 6GB RAM, 256GB storage and a 5000mAh battery.',
    price: 12500, originalPrice: 12500, discount: 0,
    images: ['https://www.ztedevices.com/content/dam/zte-devices/global/products/smartphones/blade/zte-blade-v60-design/ZTE%20Blade%20V60%20Design-front.png'],
    stock: 12, sku: 'ZTE-BLADE-V60D-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Processor: 'Unisoc T606 octa-core, 1.6 GHz', RAM: '6 GB + 10 GB Fusion RAM', Storage: '256 GB',
      Screen: '6.6-inch IPS HD+ 720 x 1612', RefreshRate: '90 Hz',
      Cameras: '50 MP AF + 2 MP depth', FrontCamera: '8 MP', Battery: '5000 mAh', Charging: '22.5W wired',
      OS: 'Android 13', Connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.2, NFC', Security: 'Side-mounted fingerprint'
    }, tags: ['ZTE', 'Blade V60 Design', '4G', 'Android', 'smartphone']
  },
  {
    name: 'Beats Studio3 Wireless',
    brand: 'Beats', model: 'Studio3 Wireless', subcategory: 'Headphones',
    majorCategory: 'Audio & Wearables',
    description: 'Black over-ear wireless headphones shown in the supplied image, with active noise cancellation and built-in microphone.',
    price: 25900, originalPrice: 25900, discount: 0,
    images: ['https://th.bing.com/th/id/OIP.67yrsv1PsBkez7M2j1FMbwHaHa'],
    stock: 10, sku: 'BEATS-STUDIO3-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Driver: 'Over-ear dynamic drivers', Connectivity: 'Bluetooth wireless + 3.5 mm wired',
      ANC: 'Pure Adaptive Noise Cancelling', BatteryLife: 'Up to 22 hours with ANC; up to 40 hours without ANC',
      Charging: 'Fast Fuel charging', Microphone: 'Built-in', Weight: '260 g',
      Compatibility: 'iOS and Android devices', Controls: 'On-ear controls'
    }, tags: ['Beats', 'Studio3', 'headphones', 'ANC', 'wireless']
  },
  {
    name: 'VOLTIX RGB Gaming Headset',
    brand: 'VOLTIX', model: 'VX-RGB-HS01', subcategory: 'Gaming Headsets',
    majorCategory: 'Audio & Wearables',
    description: 'Wired over-ear gaming headset matching the supplied image, with illuminated earcups and boom microphone.',
    price: 2999, originalPrice: 3499, discount: 14,
    images: ['https://th.bing.com/th/id/OIP.eJlvRe8TXruEb5J8FpRQpQHaHa'],
    stock: 20, sku: 'VOLTIX-RGB-HS01-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Driver: 'Dynamic over-ear drivers', Connectivity: 'Wired', Connector: '3.5 mm audio',
      Microphone: 'Flexible boom microphone', Lighting: 'RGB illuminated earcups',
      Controls: 'Inline/earcup controls', Compatibility: 'PC and compatible consoles', Design: 'Over-ear cushioned'
    }, tags: ['VOLTIX', 'gaming headset', 'RGB', 'wired', 'microphone']
  },
  {
    name: 'Sony WH-CH520 Wireless Headphones',
    brand: 'Sony', model: 'WH-CH520', subcategory: 'Headphones',
    majorCategory: 'Audio & Wearables',
    description: 'Beige wireless on-ear headphones with microphone, up to 50 hours battery life and multipoint connectivity.',
    price: 4490, originalPrice: 5990, discount: 25,
    images: ['https://cdn.media.amplience.net/i/xcite/541896-02?img404=default&w=2048&qlt=75&fmt=auto'],
    stock: 15, sku: 'SONY-WHCH520-CZE-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Driver: '30 mm dynamic driver', Connectivity: 'Bluetooth wireless', Bluetooth: 'Bluetooth 5.2',
      BatteryLife: 'Up to 50 hours', Charging: 'USB-C quick charging',
      Audio: 'DSEE audio enhancement', Microphone: 'Built-in', Multipoint: 'Two Bluetooth devices simultaneously', Weight: '147 g'
    }, tags: ['Sony', 'WH-CH520', 'headphones', 'Bluetooth', '50 hours']
  },
  {
    name: 'VOLTIX Gaming Controller',
    brand: 'VOLTIX', model: 'VX-GC01', subcategory: 'Gaming Controllers',
    majorCategory: 'Gaming & Entertainment',
    description: 'Gaming controller image supplied by the project owner; product is catalogued as a generic VOLTIX controller because no manufacturer/model is visible in the image.',
    price: 2499, originalPrice: 2999, discount: 17,
    images: ['https://img.freepik.com/premium-photo/game-white-background_1165404-47286.jpg'],
    stock: 20, sku: 'VOLTIX-GC01-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Platform: 'PC and compatible gaming devices', Connectivity: 'Controller connectivity varies by supported version',
      Controls: 'Dual-stick controller layout', Features: 'Gaming controls and ergonomic grip',
      Compatibility: 'Check device compatibility before purchase', Warranty: '6 months'
    }, tags: ['VOLTIX', 'gaming controller', 'gamepad', 'gaming']
  },
  {
    name: 'Sony DualShock 4 Wireless Controller',
    brand: 'Sony', model: 'DualShock 4', subcategory: 'Gaming Controllers',
    majorCategory: 'Gaming & Entertainment',
    description: 'White PlayStation-style wireless controller matching the supplied image.',
    price: 5050, originalPrice: 5050, discount: 0,
    images: ['https://th.bing.com/th/id/OIP.WHHLZP1OfrRuAWgL7IMDPgHaFE'],
    stock: 10, sku: 'SONY-DS4-WHITE-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Platform: 'PlayStation 4', Connectivity: 'Wireless', Controls: 'Dual analog sticks, D-pad, action buttons, triggers',
      Features: 'Touch pad, motion sensor, light bar, built-in speaker',
      Ports: 'Micro-USB, 3.5 mm headset jack', Battery: 'Built-in rechargeable battery', Warranty: '1 year'
    }, tags: ['Sony', 'PlayStation', 'DualShock 4', 'controller', 'PS4']
  },
  {
    name: 'VOLTIX Game Console',
    brand: 'VOLTIX', model: 'VX-CONSOLE01', subcategory: 'Gaming Consoles',
    majorCategory: 'Gaming & Entertainment',
    description: 'Black disc-style game console shown in the supplied image. The image does not expose a manufacturer/model, so no unsupported brand-specific specifications are claimed.',
    price: 9999, originalPrice: 10999, discount: 9,
    images: ['https://media.gettyimages.com/id/1048986312/photo/game-console-on-white-background.jpg?s=612x612&w=gi&k=20&c=-PI1dh0pRkWUzp8Z0rRnwKBImxEIvTEnxIP1aQqAkQw=',],
    stock: 8, sku: 'VOLTIX-CONSOLE01-VX12', rating: 0, reviewCount: 0, featured: false,
    specifications: {
      Platform: 'Game console', Design: 'Black console chassis',
      Connectivity: 'Model-specific; verify supported connections before purchase',
      Features: 'Console gaming hardware', Ports: 'Not identifiable from supplied image', Warranty: '6 months'
    }, tags: ['VOLTIX', 'gaming console', 'console', 'gaming']
  },
];
