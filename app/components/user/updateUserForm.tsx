import {
  TextField,
  Button,
  Typography,
  Input,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import { Box } from "@mui/system";
import { Form, useTransition } from "remix";
import { UpdateUserFormData, User } from "~/models/User";

export default function UpdateUserForm({
  user,
  formData,
  API_URL,
  userInfo,
}: {
  user: User;
  formData?: UpdateUserFormData;
  API_URL?: string;
  userInfo?: User;
}) {
  const transition = useTransition();

  return (
    <Form
      method="patch"
      action={`/users/${user.id}`}
      encType="multipart/form-data"
    >
      <input type="hidden" name="kind" value="user" />
      <Avatar
        src={`${API_URL || "http://localhost:4000/"}user/avatar/${
          user.avatarId
        }`}
        alt={user.pseudo}
        sx={{ width: 300, height: 300 }}
        style={{ margin: "auto" }}
      />
      <div style={{ textAlign: "center" }}>
        <input
          autoComplete="avatar"
          accept="image/*"
          type="file"
          name="avatar"
          id="avatar"
        />
      </div>
      <TextField
        variant="outlined"
        margin="normal"
        required
        fullWidth
        id="pseudo"
        error={Boolean(formData?.fieldsError?.pseudo)}
        helperText={formData?.fieldsError?.pseudo}
        label="Pseudonyme"
        name="pseudo"
        autoComplete="pseudo"
        defaultValue={formData?.fields?.pseudo || user.pseudo}
        autoFocus
      />
      <div style={{ display: "flex" }}>
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          name="name"
          label="Nom"
          id="name"
          defaultValue={formData?.fields?.name || user.name}
          error={Boolean(formData?.fieldsError?.name)}
          helperText={formData?.fieldsError?.name}
        />
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          name="surname"
          label="Prénom"
          id="surname"
          defaultValue={formData?.fields?.surname || user.surname}
          error={Boolean(formData?.fieldsError?.surname)}
          helperText={formData?.fieldsError?.surname}
        />
      </div>
      <div style={{ display: "flex" }}>
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          name={!userInfo || userInfo?.privilege < 1 ? "" : "wallet"}
          disabled={!userInfo || userInfo?.privilege < 1}
          label="Porte-monnaie"
          id={!userInfo || userInfo?.privilege < 1 ? "" : "wallet"}
          type="number"
          defaultValue={formData?.fields?.wallet || user.wallet}
          error={Boolean(formData?.fieldsError?.wallet)}
          helperText={formData?.fieldsError?.wallet}
        />
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          name={!userInfo || userInfo?.privilege < 1 ? "" : "privilege"}
          disabled={!userInfo || userInfo?.privilege < 1}
          label="Privilege"
          type="number"
          id={!userInfo || userInfo?.privilege < 1 ? "" : "privilege"}
          defaultValue={formData?.fields?.privilege || user.privilege}
          error={Boolean(formData?.fieldsError?.privilege)}
          helperText={formData?.fieldsError?.privilege}
        />
      </div>
      <Box>
        <Button
          disabled={transition.state === "submitting"}
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
        >
          Mettre à jour
        </Button>
        {transition.state === "submitting" && (
          <CircularProgress
            size={24}
            sx={{
              color: blue[500],
              position: "absolute",
              left: "50%",
              marginTop: "6px",
              marginLeft: "-12px",
            }}
          />
        )}
      </Box>
    </Form>
  );
}
