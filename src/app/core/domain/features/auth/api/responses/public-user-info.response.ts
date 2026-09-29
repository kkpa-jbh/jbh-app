/**
 * Answer of GET /users/userinfo (jbh-iam PublicUserInfo: username, nickName, email, roles).
 * The other fields are optional: the mapper reads them, but IAM does not send them today.
 */
export interface PublicUserInfo {
  id?: string;
  email: string;
  username: string;
  nickName: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  roles?: string[];
  permissions?: string[];
}
