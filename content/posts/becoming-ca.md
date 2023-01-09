---
title: "Becoming a Certificate Authority (CA)"
date: 2018-02-05T19:03:30+01:00
draft: false
---

A Certificate Authority or CA is an entity that signs digital certificates.
These digital certificates are used to validate the connection while using secure mechanisms.

## Generating a root CA

We will use a root CA to create intermediate CA's which are trusted to sign certificates on its behalf.

First, prepare the environment.

```bash
mkdir /root/ca && cd /root/ca
mkdir certs crl newcerts private
chmod 700 private
touch index.txt
echo 1000 > serial
```

Then download the template for `/root/ca/openssl.cnf` from [this gist](https://gist.github.com/memogarcia/2ba4b4fee8a588a7448297bc8cc4e0d9) and edit it.

```bash
vim /root/ca/openssl.cnf
```

Create the root key `ca.key.pem` and make sure to keep it secure.

```bash
openssl genrsa -aes256 -out private/ca.key.pem 4096
chmod 400 private/ca.key.pem
```

Create a root certificate `ca.cert.pem`.

```bash
openssl req -config openssl.cnf \
    -key private/ca.key.pem \
    -new -x509 -days 10957 -sha256 -extensions v3_ca \
    -out certs/ca.cert.pem
chmod 444 certs/ca.cert.pem
```

Verify the root certificate.

```bash
openssl x509 -noout -text -in certs/ca.cert.pem
```

## Generating an intermediate CA

It's best practice to use intermediate CA's instead of root CA's to sign certificates, this practice allows a root CA to revoke a compromised intermediate CA and create a new one if necessary.

Prepare the environment.

```bash
mkdir /root/ca/intermediate && cd /root/ca/intermediate
mkdir certs crl csr newcerts private
chmod 700 private
touch index.txt
echo 1000 > serial
echo 1000 > /root/ca/intermediate/crlnumber
```

Then download the template for `/root/ca/intermediate/openssl.cnf` from [this gist](https://gist.github.com/memogarcia/4c82f92bb4daf7ebc22517df24ce7a61) and edit it.

```bash
vim /root/ca/intermediate/openssl.cnf
```

Create the intermediate key `intermediate.key.pem`.

```bash
cd /root/ca
openssl genrsa -aes256 \
    -out intermediate/private/intermediate.key.pem 4096
chmod 400 intermediate/private/intermediate.key.pem
```

With the intermediate key create an intermediate certificate request `intermediate.csr.pem` for the root certificate to sign. **Make sure that Common Name is different from your root CA**

```bash
openssl req -config intermediate/openssl.cnf -new -sha256 \
    -key intermediate/private/intermediate.key.pem \
    -out intermediate/csr/intermediate.csr.pem
```

The root CA will sign this certificate using `v3_intermediate_ca` extension. **Make sure is valid for less time than the root CA**

```bash
openssl ca -config openssl.cnf -extensions v3_intermediate_ca \
    -days 3650 -notext -md sha256 \
    -in intermediate/csr/intermediate.csr.pem \
    -out intermediate/certs/intermediate.cert.pem
chmod 444 intermediate/certs/intermediate.cert.pem
```

`index.txt` is the database file. **Do NOT delete this file**

Veify the intermediate certificate.

```bash
openssl x509 -noout -text \
    -in intermediate/certs/intermediate.cert.pem
```

Verify the intermediate CA against the root CA, the output should be `OK`.

```bash
openssl verify -CAfile certs/ca.cert.pem \
    intermediate/certs/intermediate.cert.pem
```

After the verification is `OK`, chain the root CA and intermediate CA into a chain CA. **This is only necessary if the root certificate is not installed on the client machines**

```bash
cat intermediate/certs/intermediate.cert.pem \
    certs/ca.cert.pem > intermediate/certs/ca-chain.cert.pem
chmod 444 intermediate/certs/ca-chain.cert.pem
```

## Client certificates

The intermediate certificate will be used to sign client certificates. **Skip this step if you have a CSR already.**

```bash
cd /root/ca
openssl genrsa -aes256 \
    -out intermediate/private/www.example.com.key.pem 2048
chmod 400 intermediate/private/www.example.com.key.pem
```

Using 2048 bits for encryption on the client certificates is faster for TLS handshakes and lighter on the CPU but is less secure than using 4096 bits. Use it at discretion.

Using the private key `intermediate/private/www.example.com.key.pem`, create a CSR file. **Skip this step if you have a CSR already.**

```bash
openssl req -config intermediate/openssl.cnf \
    -key intermediate/private/www.example.com.key.pem \
    -new -sha256 -out intermediate/csr/www.example.com.csr.pem
```

### Signing client certificates

To create a certificate, use the intermediate CA to sign the CSR.

If the certificate is going to use for:

1. servers, use `server_cert` extension.
2. authentication, use `usr_cert` extension.

Usually, client certificates are valid for less time than the CA's.

```bash
cd /root/ca
openssl ca -config intermediate/openssl.cnf \
    -extensions server_cert -days 375 -notext -md sha256 \
    -in intermediate/csr/www.example.com.csr.pem \
    -out intermediate/certs/www.example.com.cert.pem
chmod 444 intermediate/certs/www.example.com.cert.pem
```

### Verification

Verify that `intermediate/index.txt` contains a `CN` for your domain.

Verify the certificate.

```bash
openssl x509 -noout -text \
    -in intermediate/certs/www.example.com.cert.pem
```

Verify the CA certificate chain. the output should be `OK`.

```bash
openssl verify -CAfile intermediate/certs/ca-chain.cert.pem \
    intermediate/certs/www.example.com.cert.pem
```

### Distribution

Distribute and/or deploy the following files:

* `/root/ca/intermediate/certs/ca-chain.cert.pem`
* `/root/ca/intermediate/private/www.example.com.key.pem`  **Only if you are signing the CSR**
* `/root/ca/intermediate/certs/www.example.com.cert.pem`

## Next steps

1. Sign certificates
2. Cash in
3. Sell out
4. Bro down

## References

[OpenSSL Certificate Authority](https://jamielinux.com/docs/openssl-certificate-authority/index.html)
