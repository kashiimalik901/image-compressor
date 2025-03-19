import Link from 'next/link';
import Image from 'next/image';
export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/">
        <a>
          <Image src="/logo.webp" alt="Logo" width={50} height={50} className="mb-4" />
        </a>
      </Link>
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <div className="prose dark:prose-invert max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using the Image Compressor Tool website, you agree to be bound by these Terms of Service.</p>

        <h2>2. Description of Service</h2>
        <p>
          Image Compressor Tool provides a free online service that allows users to compress image files directly in
          their browser without uploading them to our servers.
        </p>

        <h2>3. Use of the Service</h2>
        <p>
          You may use our service for personal or commercial purposes. You are responsible for ensuring that you have
          the right to compress any images you process using our tool.
        </p>

        <h2>4. Limitations</h2>
        <p>
          The service has a file size limit of 10MB per image. We reserve the right to change this limit at any time.
        </p>

        <h2>5. Disclaimer of Warranties</h2>
        <p>
          The service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee
          that the service will be uninterrupted or error-free.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          We shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages
          arising from your use of the service or any content processed through it.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms of Service at any time. Your continued use of the service after
          such changes constitutes your acceptance of the new terms.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without
          regard to its conflict of law provisions.
        </p>

        <h2>9. Contact</h2>
        <p>If you have any questions about these Terms, please contact us at terms@v0-image-compression-tool.vercel.app.</p>
      </div>
    </div>
  )
}

