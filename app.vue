<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>

        <!-- Outside the layout, so it is raised once per visit rather than once
             per navigation. -->
        <DemoNotice />
    </div>
</template>
