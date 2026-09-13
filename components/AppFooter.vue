<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
    <footer class="app-footer">
        <div class="container app-footer__inner">
            <p class="mb-0">
                &copy; {{ year }} <strong>CSHP &mdash; Demo</strong>, made by
                <strong>LaurieJohn</strong>. Sample data only.
            </p>

            <div class="app-footer__links">
                <a href="https://ljar.vercel.app/" target="_blank" rel="noopener">
                    Visit my Portfolio
                </a>

                <!-- Decorative: the gap already separates the links for anyone
                     not seeing it, so it is hidden from assistive technology. -->
                <span class="app-footer__sep" aria-hidden="true">|</span>

                <a
                    href="https://ljar.vercel.app/projects/cshp-online-system"
                    target="_blank"
                    rel="noopener"
                >
                    Read Case Study
                </a>
            </div>
        </div>
    </footer>
</template>
