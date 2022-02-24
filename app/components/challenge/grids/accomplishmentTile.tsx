import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
} from "@mui/material";
import {
  Accomplishment,
  ValidateAccomplishmentFormData,
} from "~/models/Accomplishment";

export default function AccomplishmentTile({
  accomplishment,
  userPrivilege,
  formData,
}: {
  accomplishment: Accomplishment;
  userPrivilege?: number;
  formData?: ValidateAccomplishmentFormData;
}) {
  return (
    <Card>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {new Date(accomplishment.createdAt).toLocaleDateString()}
        </Typography>
        <Typography variant="h5" component="div">
          {accomplishment.validation}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {accomplishment?.proof}
        </Typography>
      </CardContent>
      {userPrivilege &&
      userPrivilege >= 1 &&
      accomplishment.validation === "PENDING" ? (
        <CardActions>
          {/* Form to validate an accomplishment */}
          <form
            style={{ display: "flex", justifyContent: "space-between" }}
            method="post"
          >
            <input
              type="hidden"
              name="accomplishmentId"
              value={accomplishment.id}
            />
            <input
              type="hidden"
              name="method"
              value="validate-accomplishment"
            />
            <Button
              size="small"
              type="submit"
              name="validation"
              id="validation"
              value="1"
            >
              Validate
            </Button>
            <Button
              size="small"
              type="submit"
              name="validation"
              value="-1"
              id="validation"
            >
              Refuse
            </Button>
          </form>
        </CardActions>
      ) : (
        ""
      )}
    </Card>
  );
}
