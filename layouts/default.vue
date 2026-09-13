<template>
    <div class="app-shell">
        <AppNavbar />

        <main class="app-main">
            <div class="container">
                <slot />
            </div>
        </main>

        <AppFooter />

        <AppModal />
        <AppToasts />
    </div>
</template>
