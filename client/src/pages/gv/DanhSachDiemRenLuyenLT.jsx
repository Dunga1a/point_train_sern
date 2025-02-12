import { Box, Button, IconButton, Tooltip } from "@mui/material";
import Badge from "components/Badge";
import Header from "components/Header";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import PreviewIcon from "@mui/icons-material/Preview";
import DoNotStepIcon from "@mui/icons-material/DoNotStep";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getPointStudentTeacherByMaLopAndMaHK } from "utils/getMany/getPointStudentTeacherByMaLopAndMaHK";
import SwipeLeftIcon from "@mui/icons-material/SwipeLeft";
import MaterialReactTable from "material-react-table";
import ModalV1 from "components/modal/ModalV1";
import DuyetDiemRenLuyenGV from "./DuyetDiemRenLuyenGV";
import Modal from "components/modal/Modal";
import UploadProofStudent from "components/student/UploadProofStudent";
import axios from "axios";
import { toast } from "react-toastify";
const DOMAIN = process.env.REACT_APP_DOMAIN;

const DanhSachDiemRenLuyenLT = () => {
  const { maLop, maHK } = useParams();
  const [danhSachDiemSinhVien, setDanhSachDiemSinhVien] = useState([]);
  const [sinhVienItem, setSinhVienItem] = useState();
  const [openFormDRL, setOpenFormDRL] = useState(false);
  const [openFormMinhChung, setOpenFormMinhChung] = useState(false);
  const [openFormConfirm, setOpenFormConfirm] = useState(false);
  //   console.log("maLop: ", maLop);
  //   console.log("maHK: ", maHK);
  const navigate = useNavigate();
  const fetchData = async () => {
    const res = await getPointStudentTeacherByMaLopAndMaHK(
      `maLop=${maLop}&maHK=${maHK}`
    );
    const newData = res.map((item, idx) => ({
      STT: idx + 1,
      ...item,
    }));
    setDanhSachDiemSinhVien(newData);
    console.log("res: ", res);
  };
  useEffect(() => {
    fetchData();
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "STT",
        header: "STT",
        minSize: 40, //min size enforced during resizing
        maxSize: 100, //max size enforced during resizing
        size: 40, //medium column
      },
      {
        accessorKey: "maSv",
        header: "MSSV",
        size: 140,
      },
      {
        accessorKey: "name",
        header: "Họ Và Tên",
        size: 140,
      },
      {
        accessorKey: "point_student",
        header: "Điểm SV",
        size: 40, //medium column
      },
      {
        accessorKey: "point_monitor",
        header: "Điểm LT",
        size: 50,
      },
      {
        accessorKey: "point_teacher",
        header: "Điểm HĐ Khoa",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Trạng Thái",
        size: 140,
        Cell: ({ cell, row }) => {
          const status = row.original.status_teacher;
          return (
            <Box>
              <Badge
                label={`${status === 0 ? "Chưa duyệt" : "Đã duyệt"}`}
                className={`${
                  status === 0
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                } `}
              />
            </Box>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Thao tác",
        size: 140,
        Cell: ({ cell, row }) => {
          // console.log("row trong thao tacs: ", row.original);
          const status = row.original.status;
          return (
            <Box>
              <Tooltip
                title={`${
                  status === 0 ? "Duyệt điểm rèn luyện" : "Sửa điểm rèn luyện"
                }`}
              >
                <IconButton
                  onClick={() => {
                    setOpenFormDRL(true);
                    setSinhVienItem(row.original);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xem minh chứng">
                <IconButton
                  onClick={() => {
                    setSinhVienItem(row.original);
                    setOpenFormMinhChung(true);
                  }}
                >
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xét điểm = 0 do SV không sinh hoạt lớp">
                <IconButton
                  onClick={() => {
                    setSinhVienItem(row.original);
                    setOpenFormConfirm(true);
                  }}
                >
                  <DoNotStepIcon />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [danhSachDiemSinhVien]
  );

  // minh chung
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [handleChangeFile, setHandleChangeFile] = useState(false);
  const [chooseFiles, setChooseFiles] = useState([]);

  const handleUpload = async () => {
    // TODO khi file change thì mới call api upload img
    let file_img = null;
    let choose_file = chooseFiles;
    // console.log("choose_file: ", choose_file);
    if (handleChangeFile) {
      try {
        // console.log("change file: ", selectedFiles);
        // console.log("change file v1: ", selectedFiles);

        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
        await axios.post(`${DOMAIN}/upload`, formData).then(async (res) => {
          file_img = res.data.join(",");
          // choose_file = [...chooseFiles, file_img];
          choose_file = [file_img];
          const values = {
            name_image: choose_file.length ? choose_file.join(",") : "",
            maSv: sinhVienItem?.maSv,
          };
          // console.log("values: ", choose_file);
          await axios
            .post(
              `${DOMAIN}/proof_mark/create_or_update_proof/${maHK}`,
              values,
              {
                withCredentials: true,
              }
            )
            .then(async (res) => {
              toast.success(res.data);
            });
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    } else {
      try {
        const values = {
          name_image: chooseFiles.length ? chooseFiles.join(",") : "",
          maSv: sinhVienItem?.maSv,
        };
        // console.log("values moi: ", values);
        await axios
          .post(`${DOMAIN}/proof_mark/create_or_update_proof/${maHK}`, values, {
            withCredentials: true,
          })
          .then(async (res) => {
            toast.success(res.data);
          });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  useEffect(() => {
    if (openFormMinhChung === false) {
      setHandleChangeFile(false);
    }
  }, [openFormMinhChung]);
  const handleConfirm = async () => {
    try {
      const values = {
        text: "Không sinh hoạt lớp",
      };
      const res = await axios.post(
        `${DOMAIN}/points/confirm_zero?maSv=${sinhVienItem?.maSv}&maHK=${maHK}`,
        values,
        {
          withCredentials: true,
        }
      );
      // console.log("res:", res);
      toast.success("Thay đổi điểm thành công");
      fetchData();
      setOpenFormConfirm(false);
    } catch (error) {
      console.log(error);
    }
  };
  // end minh chung
  return (
    <Box m="1.5rem 2.5rem">
      <Header
        title={`Danh Sách Sinh Viên Lớp - ${maLop}`}
        subtitle={`Xét Duyệt Điểm Rèn Luyện - ${maHK} `}
      />
      <Button
        variant="contained"
        sx={{
          margin: "5px 0px 15px",
        }}
        color="secondary"
        onClick={() => {
          navigate(`/quanlylopchunhiem/${maLop}`);
        }}
      >
        <SwipeLeftIcon />
      </Button>
      <Box>
        <MaterialReactTable
          displayColumnDefOptions={{
            "mrt-row-actions": {
              muiTableHeadCellProps: {
                align: "center",
              },
              size: 50,
            },
          }}
          columns={columns}
          data={danhSachDiemSinhVien}
          editingMode="modal"
          enableColumnOrdering
        />
      </Box>
      {sinhVienItem && (
        <ModalV1
          open={openFormDRL}
          setOpen={setOpenFormDRL}
          title={`Điểm rèn luyện của ${sinhVienItem?.name} `}
          changeHeight={true}
          displayButtonOk={false}
        >
          <DuyetDiemRenLuyenGV
            sinhVienItem={sinhVienItem}
            fetchData={fetchData}
            setOpen={setOpenFormDRL}
          />
        </ModalV1>
      )}
      {sinhVienItem && (
        <Modal
          open={openFormMinhChung}
          setOpen={setOpenFormMinhChung}
          title={"Xét Duyệt Minh Chứng"}
          displayButtonOk={false}
          displayButtonCancel={false}
          classNameChildren={"w-[800px]"}
        >
          <UploadProofStudent
            maHK={maHK}
            maSv={sinhVienItem.maSv}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            handleChangeFile={handleChangeFile}
            setHandleChangeFile={setHandleChangeFile}
            chooseFiles={chooseFiles}
            setChooseFiles={setChooseFiles}
            handleUpload={handleUpload}
          />
        </Modal>
      )}

      {sinhVienItem && (
        <Modal
          open={openFormConfirm}
          setOpen={setOpenFormConfirm}
          // title={"Xét Duyệt Minh Chứng"}
          displayButtonOk={false}
          displayButtonCancel={false}
          classNameChildren={"w-[400px]"}
        >
          <div className="text-center">
            <CheckCircleIcon
              sx={{
                height: "40px",
                width: "40px",
              }}
            />
          </div>
          <p>
            Bạn có chắc muốn xét điểm rèn luyện cho sinh viên{" "}
            <b>{sinhVienItem?.name}</b> = 0 hay không?
          </p>
          <div className="flex justify-around gap-2">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleConfirm()}
            >
              Đồng Ý
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenFormConfirm(false)}
            >
              Thoát
            </Button>
          </div>
        </Modal>
      )}
    </Box>
  );
};

export default DanhSachDiemRenLuyenLT;
