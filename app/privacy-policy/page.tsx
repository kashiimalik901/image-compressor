import Link from 'next/link';
export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
       <Link href="/">
        <button className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Home
        </button>
      </Link>
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose dark:prose-invert max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>Introduction</h2>
        <p>
          At Image Compressor Tool, we respect your privacy and are committed to protecting your personal data. This
          Privacy Policy explains how we handle your data when you use our image compression service.
        </p>

        <h2>Data We Collect</h2>
        <p>
          Our image compression tool processes all images directly in your browser. We do not upload, store, or have
          access to any images you compress using our tool. The entire compression process happens on your device.
        </p>

        <h2>Analytics</h2>
        <p>
          We use anonymous analytics to understand how users interact with our website. This helps us improve our
          service. The analytics data does not include any personally identifiable information.
        </p>

        <h2>Cookies</h2>
        <p>
          We use essential cookies to ensure the proper functioning of our website. These cookies do not track you
          across websites and are only used to enhance your experience.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
          Privacy Policy on this page.
        </p>

        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at privacy@v0-image-compression-tool.vercel.app.</p>
      </div>
    </div>
  )
}

