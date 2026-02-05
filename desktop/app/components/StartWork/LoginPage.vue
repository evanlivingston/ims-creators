<template>
  <div class="LoginPage">
    <LoginForm
      v-if="showType === 'login'"
      class="LoginPage-form"
      :message="message"
      @success-login="successLogin"
      @complete-registration="missingFields = $event"
      @show-register="showType = 'register'"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import LoginForm from './LoginForm.vue';
import { getShowcaseBaseLink } from '~ims-app-base/logic/router/routes-helpers';

export default defineComponent({
  name: 'LoginPage',
  components: {
    LoginForm,
  },
  props: {
    type: {
      type: String as PropType<'login' | 'register'>,
      default: '',
    },
  },
  data() {
    return {
      missingFields: null,
      showType: this.type,
    };
  },
  computed: {
    message(): string {
      return (this.$route.query ? this.$route.query.error : '') as string;
    },
  },
  methods: {
    successLogin() {
      if (this.$route.query.redirect) {
        if (this.$route.query.redirectFromService === 'showcase') {
          window.location.assign(
            getShowcaseBaseLink() + this.$route.query.redirect,
          );
        } else {
          this.$router.replace(this.$route.query.redirect as string);
        }
      } else {
        this.$router.replace({
          name: 'app-main',
        });
      }
    },
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/AuthForm';
@use '~ims-app-base/style/Form';

.LoginPage {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  flex-wrap: wrap;
}
.LoginPage-form {
  background: var(--local-box-color);
  margin-top: 45px;
}
</style>
