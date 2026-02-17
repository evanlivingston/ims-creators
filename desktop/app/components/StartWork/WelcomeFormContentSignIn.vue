<template>
    <div class="WelcomeFormContentSignIn">
        <div
            class="WelcomeFormContentCreateProject-back use-buttons-without-border"
        >
            <button class="is-button" @click="$emit('back')">
                <i class="ri-arrow-left-line"></i>
                {{ $t('desktop.welcome.back') }}
            </button>
        </div>
        <login-form
            :open-external="true"
            @success-login="$emit('successLogin')"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LoginForm from './LoginForm.vue';
export default defineComponent({
    name: 'WelcomeFormContentSignIn',
    components: {
        LoginForm,
    },
    emits: ['successLogin', 'back'],
})
</script>
<style>
.WelcomeFormContentSignIn{
    .AuthForm{
    padding: 0;
    }
}
</style>