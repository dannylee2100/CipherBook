# Milestone 2B study-asset attributions

The mappings and package below are used only in the disposable Milestone 2B
experiment. Their inclusion does not approve a CipherBook fingerprint or QR
format.

## Matrix SAS emoji table

The 64 symbol/code-point/English-label rows in `src/emoji-table.js` are adapted
from `matrix-org/matrix-spec`, `data-definitions/sas-emoji.json`, commit
`4c2bb5aae19dcb15e2bee3127d57de80b5068195`:

<https://github.com/matrix-org/matrix-spec/blob/4c2bb5aae19dcb15e2bee3127d57de80b5068195/data-definitions/sas-emoji.json>

The source repository is licensed under the Apache License 2.0. CipherBook's
root `LICENSE` contains a copy of that license. The experiment removes
translations and stores only the published index, symbol, English description,
and code-point sequence. The table is non-normative for CipherBook.

## Blockchain Commons Bytewords list

The 256 words in `src/word-list.js` are copied in byte-index order from
BCR-2020-012, “Bytewords: Encoding binary data as English words,” © 2020
Blockchain Commons, by Wolf McNally and Christopher Allen, pinned at commit
`bacd8054be636ec48b0118763384cf6c7f947ab7`:

<https://github.com/BlockchainCommons/Research/blob/bacd8054be636ec48b0118763384cf6c7f947ab7/papers/bcr-2020-012-bytewords.md>

The source repository applies the BSD-2-Clause-Patent license below. This
experiment uses the word mapping only; it does not implement or claim the
Bytewords checksum, URI form, CBOR conventions, or interoperability.

BSD-2-Clause Plus Patent License

SPDX-License-Identifier: BSD-2-Clause-Patent

Copyright © 2019 Blockchain Commons, LLC

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

Subject to the terms and conditions of this license, each copyright holder and
contributor hereby grants to those receiving rights under this license a
perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable
(except for failure to satisfy the conditions of this license) patent license
to make, have made, use, offer to sell, sell, import, and otherwise transfer
this software, where such license applies only to those patent claims, already
acquired or hereafter acquired, licensable by such copyright holder and
contributor that are necessarily infringed by:

(a) their Contribution(s) (the licensed copyrights of copyright holders and
non-copyrightable additions of contributors, in source or binary form) alone;
or

(b) combination of their Contribution(s) with the work of authorship to which
such Contribution(s) was added by such copyright holder or contributor, if, at
the time the Contribution is added, such addition causes such combination to be
necessarily infringed. The patent license shall not apply to any other
combinations which include the Contribution.

Except as expressly stated above, no rights or licenses from any copyright
holder or contributor is granted under this license, whether expressly, by
implication, estoppel or otherwise.

DISCLAIMER

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## `@nuintun/qrcode`

The locally bundled QR encoder/decoder is `@nuintun/qrcode` 5.0.3:

<https://github.com/nuintun/qrcode/tree/5.0.3/packages/core>

MIT License

Copyright (c) 2018 nuintun

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## `tslib`

`@nuintun/qrcode` 5.0.3 depends on `tslib` 2.8.1. It is bundled locally as a
small JavaScript helper runtime and does not add another network or storage
interface.

Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
